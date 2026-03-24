import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

// Challenge store in memory by userId.
// Key -1 is reserved for "discoverable credentials" flow (no email provided).
// In production: replace with Redis with a 5-minute TTL.
const challengeStore = new Map<number, string>();
const DISCOVERABLE_KEY = -1;

/** Shape persisted in users.webauthnCredential (JSON string) */
interface StoredCredential {
  id: string;          // Base64URLString — credential ID
  publicKey: string;   // Base64URLString — raw COSE public key bytes
  counter: number;
  rpID: string;
}

@Injectable()
export class WebAuthnService {
  private readonly rpName = 'ELA Beauty';
  private readonly rpID   = 'localhost';
  private readonly origin = 'http://localhost:4200';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async generateRegistrationOptions(userId: number) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    const options = await generateRegistrationOptions({
      rpName:          this.rpName,
      rpID:            this.rpID,
      userID:          Buffer.from(String(user.id)),
      userName:        user.email,
      userDisplayName: `${user.firstName} ${user.apellidoPaterno}`,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey:      'preferred',
        userVerification: 'preferred',
      },
    });

    challengeStore.set(userId, options.challenge);
    return options;
  }

  async verifyRegistration(userId: number, response: RegistrationResponseJSON) {
    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) throw new BadRequestException('Challenge no encontrado o expirado');

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID:   this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Registro WebAuthn fallido');
    }

    const { credential } = verification.registrationInfo;

    const stored: StoredCredential = {
      id:        credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter:   credential.counter,
      rpID:      this.rpID,
    };

    await this.userRepo.update(userId, {
      webauthnCredential: JSON.stringify(stored),
    });

    challengeStore.delete(userId);
    return { verified: true };
  }

  // email is optional: if provided, returns user-specific allowCredentials.
  // If absent, uses discoverable credentials (browser shows passkey picker).
  async generateAuthOptions(email?: string): Promise<{ options: any; userId?: number }> {
    if (!email) {
      // Discoverable credentials: let the browser/OS pick the passkey
      const options = await generateAuthenticationOptions({
        rpID:             this.rpID,
        userVerification: 'preferred',
        allowCredentials: [],
      });
      challengeStore.set(DISCOVERABLE_KEY, options.challenge);
      return { options };
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user?.webauthnCredential) {
      throw new BadRequestException('Este usuario no tiene Passkey registrado');
    }

    const stored: StoredCredential = JSON.parse(user.webauthnCredential);

    const options = await generateAuthenticationOptions({
      rpID:             this.rpID,
      userVerification: 'preferred',
      allowCredentials: [{ id: stored.id }],
    });

    challengeStore.set(user.id, options.challenge);
    return { options, userId: user.id };
  }

  // userId is optional for discoverable credentials: backend resolves user from credential ID.
  async verifyAuthentication(userId: number | null, response: AuthenticationResponseJSON): Promise<User> {
    let user: User;
    let challengeKey: number;

    if (userId != null) {
      user = await this.userRepo.findOneOrFail({ where: { id: userId } });
      challengeKey = userId;
    } else {
      // Discoverable flow: find user by credential ID embedded in the response
      user = await this.findUserByCredentialId(response.id);
      challengeKey = DISCOVERABLE_KEY;
    }

    if (!user.webauthnCredential) throw new BadRequestException('Sin Passkey registrado');

    const expectedChallenge = challengeStore.get(challengeKey);
    if (!expectedChallenge) throw new BadRequestException('Challenge no encontrado o expirado');

    const stored: StoredCredential = JSON.parse(user.webauthnCredential);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID:   this.rpID,
      credential: {
        id:        stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, 'base64url')),
        counter:   stored.counter,
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Passkey inválido');

    stored.counter = verification.authenticationInfo.newCounter;
    await this.userRepo.update(user.id, { webauthnCredential: JSON.stringify(stored) });

    challengeStore.delete(challengeKey);
    return user;
  }

  private async findUserByCredentialId(credentialId: string): Promise<User> {
    const users = await this.userRepo.find({
      where: { webauthnCredential: Not(IsNull()) },
    });
    const match = users.find(u => {
      const stored: StoredCredential = JSON.parse(u.webauthnCredential!);
      return stored.id === credentialId;
    });
    if (!match) throw new UnauthorizedException('Passkey no encontrado');
    return match;
  }
}
