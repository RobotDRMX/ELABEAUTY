import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
// In production: replace with Redis with a 5-minute TTL.
const challengeStore = new Map<number, string>();

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
      userDisplayName: `${user.firstName} ${user.lastName}`,
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

    // v13 API: registrationInfo.credential is a WebAuthnCredential
    // { id: Base64URLString, publicKey: Uint8Array_, counter: number }
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

  // Returns { options, userId } so the client can send userId back in /login/verify.
  // This avoids calling generateAuthOptions twice (which would overwrite the challenge).
  async generateAuthOptions(email: string): Promise<{ options: any; userId: number }> {
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

  async verifyAuthentication(userId: number, response: AuthenticationResponseJSON): Promise<User> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.webauthnCredential) throw new BadRequestException('Sin Passkey registrado');

    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) throw new BadRequestException('Challenge no encontrado o expirado');

    const stored: StoredCredential = JSON.parse(user.webauthnCredential);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID:   this.rpID,
      // v13: credential must be a WebAuthnCredential
      // { id: Base64URLString, publicKey: Uint8Array_, counter: number }
      credential: {
        id:        stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, 'base64url')),
        counter:   stored.counter,
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Passkey inválido');

    // Update counter to prevent replay attacks
    stored.counter = verification.authenticationInfo.newCounter;
    await this.userRepo.update(userId, { webauthnCredential: JSON.stringify(stored) });

    challengeStore.delete(userId);
    return user;
  }
}
