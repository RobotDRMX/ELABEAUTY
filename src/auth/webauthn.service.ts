import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { WebAuthnChallenge } from './entities/webauthn-challenge.entity';
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

interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
  rpID: string;
}

@Injectable()
export class WebAuthnService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;
  private readonly CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WebAuthnChallenge)
    private readonly challengeRepo: Repository<WebAuthnChallenge>,
    private readonly configService: ConfigService,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const url = new URL(frontendUrl);
    this.rpID = url.hostname;
    this.origin = url.origin;
    this.rpName = 'ELA Beauty';
  }

  private async storeChallenge(userId: number | null, challenge: string): Promise<void> {
    // Remove any existing challenge for this user
    if (userId !== null) {
      await this.challengeRepo.delete({ userId });
    }
    await this.challengeRepo.save({
      userId,
      challenge,
      expiresAt: new Date(Date.now() + this.CHALLENGE_TTL_MS),
    });
  }

  private async consumeChallenge(userId: number | null): Promise<string> {
    const where = userId !== null ? { userId } : { userId: IsNull() as any };
    const record = await this.challengeRepo.findOne({ where });
    if (!record || record.expiresAt < new Date()) {
      if (record) await this.challengeRepo.delete(record.id);
      throw new BadRequestException('Challenge no encontrado o expirado');
    }
    await this.challengeRepo.delete(record.id);
    return record.challenge;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredChallenges(): Promise<void> {
    await this.challengeRepo.delete({ expiresAt: LessThan(new Date()) });
  }

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

    await this.storeChallenge(userId, options.challenge);
    return options;
  }

  async verifyRegistration(userId: number, response: RegistrationResponseJSON) {
    const expectedChallenge = await this.consumeChallenge(userId);

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

    return { verified: true };
  }

  async generateAuthOptions(email?: string): Promise<{ options: any; userId?: number }> {
    if (!email) {
      const options = await generateAuthenticationOptions({
        rpID:             this.rpID,
        userVerification: 'preferred',
        allowCredentials: [],
      });
      await this.storeChallenge(null, options.challenge);
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

    await this.storeChallenge(user.id, options.challenge);
    return { options, userId: user.id };
  }

  async verifyAuthentication(userId: number | null, response: AuthenticationResponseJSON): Promise<User> {
    let user: User;
    let challengeUserId: number | null;

    if (userId != null) {
      user = await this.userRepo.findOneOrFail({ where: { id: userId } });
      challengeUserId = userId;
    } else {
      user = await this.findUserByCredentialId(response.id);
      challengeUserId = null;
    }

    if (!user.webauthnCredential) throw new BadRequestException('Sin Passkey registrado');

    const expectedChallenge = await this.consumeChallenge(challengeUserId);
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

    if (!verification.verified) throw new UnauthorizedException('Passkey invalido');

    stored.counter = verification.authenticationInfo.newCounter;
    await this.userRepo.update(user.id, { webauthnCredential: JSON.stringify(stored) });

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
