import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FaceService {
  private readonly THRESHOLD = 0.45;
  private readonly encryptionKey: Buffer | null;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const keyHex = this.configService.get<string>('BIOMETRIC_ENCRYPTION_KEY');
    this.encryptionKey = keyHex ? Buffer.from(keyHex, 'hex') : null;
  }

  private encrypt(descriptor: number[]): string {
    if (!this.encryptionKey) {
      // Fallback: store as plain JSON if no key configured (dev only)
      return JSON.stringify(descriptor);
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const plaintext = JSON.stringify(descriptor);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: base64(iv + tag + ciphertext)
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(stored: string): number[] {
    // Try JSON parse first (legacy unencrypted data)
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON — must be encrypted
    }

    if (!this.encryptionKey) {
      throw new BadRequestException('Datos biometricos cifrados pero no hay clave de descifrado configurada');
    }

    const data = Buffer.from(stored, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  async saveDescriptor(userId: number, descriptor: number[]): Promise<{ saved: boolean }> {
    if (descriptor.length !== 128) {
      throw new BadRequestException('El descriptor facial debe tener exactamente 128 valores');
    }
    await this.userRepo.update(userId, { faceDescriptor: this.encrypt(descriptor) });
    return { saved: true };
  }

  async verifyDescriptor(
    userId: number,
    incoming: number[],
  ): Promise<{ hasDescriptor: boolean; match: boolean }> {
    if (incoming.length !== 128) {
      throw new BadRequestException('El descriptor facial entrante debe tener exactamente 128 valores');
    }
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.faceDescriptor) return { hasDescriptor: false, match: false };

    const stored = this.decrypt(user.faceDescriptor);
    const match = this.euclideanDistance(stored, incoming) < this.THRESHOLD;
    return { hasDescriptor: true, match };
  }

  async findUserByFace(incoming: number[], email?: string): Promise<Omit<User, 'password'>> {
    if (incoming.length !== 128) {
      throw new BadRequestException('Descriptor facial invalido');
    }

    let users: User[];
    if (email) {
      // Search only the specific user (O(1) instead of O(n))
      const user = await this.userRepo.findOne({
        where: { email, faceDescriptor: Not(IsNull()), isActive: true },
      });
      users = user ? [user] : [];
    } else {
      users = await this.userRepo.find({
        where: { faceDescriptor: Not(IsNull()), isActive: true },
      });
    }

    let bestMatch: User | null = null;
    let bestDistance = Infinity;

    for (const user of users) {
      const stored = this.decrypt(user.faceDescriptor!);
      const dist = this.euclideanDistance(stored, incoming);
      if (dist < this.THRESHOLD && dist < bestDistance) {
        bestMatch = user;
        bestDistance = dist;
      }
    }

    if (!bestMatch) {
      throw new UnauthorizedException('Rostro no reconocido. Asegurate de haber registrado tu cara en tu perfil.');
    }

    const { password, ...result } = bestMatch;
    return result as Omit<User, 'password'>;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}
