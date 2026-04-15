import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

@Injectable()
export class FaceService {
  private readonly logger = new Logger(FaceService.name);
  private readonly THRESHOLD = 0.55; // Umbral de similitud (menor es más estricto) — aumentado para producción
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY: Buffer;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('BIOMETRIC_ENCRYPTION_KEY');
    if (!secret) {
      this.logger.error('BIOMETRIC_ENCRYPTION_KEY no definida');
      throw new Error('Configuración de seguridad biométrica incompleta');
    }
    // Asegurar que la llave tenga 32 bytes
    this.KEY = createHash('sha256').update(secret).digest();
  }

  private encrypt(data: number[]): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.ALGORITHM, this.KEY, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(combined: string): number[] {
    const buffer = Buffer.from(combined, 'base64');
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = createDecipheriv(this.ALGORITHM, this.KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = decipher.update(encrypted) + decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async saveDescriptor(userId: number, descriptor: number[]): Promise<{ message: string }> {
    if (descriptor.length !== 128) {
      throw new BadRequestException('El descriptor facial debe tener exactamente 128 valores');
    }
    const encrypted = this.encrypt(descriptor);
    await this.userRepo.update(userId, { faceDescriptor: encrypted });
    return { message: 'Descriptor facial guardado correctamente' };
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

    try {
      const stored = this.decrypt(user.faceDescriptor);
      const match = this.euclideanDistance(stored, incoming) < this.THRESHOLD;
      return { hasDescriptor: true, match };
    } catch {
      return { hasDescriptor: true, match: false };
    }
  }

  async findUserByFace(incoming: number[], email?: string): Promise<Omit<User, 'password'>> {
    if (incoming.length !== 128) {
      throw new BadRequestException('Descriptor facial invalido');
    }

    let users: User[];
    if (email) {
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
      try {
        const stored = this.decrypt(user.faceDescriptor!);
        const dist = this.euclideanDistance(stored, incoming);
        // [DEBUG] Log de distancia para diagnóstico — remover en producción estable
        this.logger.debug(
          `[FaceService] userId=${user.id} email=${user.email} → distancia=${dist.toFixed(4)} (umbral=${this.THRESHOLD})`,
        );
        if (dist < this.THRESHOLD && dist < bestDistance) {
          bestMatch = user;
          bestDistance = dist;
        }
      } catch {
        this.logger.warn(`[FaceService] Descriptor corrupto para userId=${user.id}, omitiendo.`);
      }
    }

    // [DEBUG] Resumen final para identificar por qué falla
    if (!bestMatch) {
      this.logger.warn(
        `[FaceService] Sin coincidencia — bestDistance=${bestDistance === Infinity ? 'N/A (sin usuarios)' : bestDistance.toFixed(4)}, umbral=${this.THRESHOLD}, email=${email ?? 'sin email'}`,
      );
      throw new UnauthorizedException('Rostro no reconocido. Asegurate de haber registrado tu cara en tu perfil.');
    }

    const { password, ...result } = bestMatch;
    return result as Omit<User, 'password'>;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}
