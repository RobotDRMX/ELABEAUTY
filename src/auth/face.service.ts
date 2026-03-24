import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FaceService {
  // Euclidean distance threshold. Values below = more similar.
  // 0.45 is strict (face-api.js recommends 0.6; we use 0.45 for e-commerce security).
  private readonly THRESHOLD = 0.45;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async saveDescriptor(userId: number, descriptor: number[]): Promise<{ saved: boolean }> {
    if (descriptor.length !== 128) {
      throw new BadRequestException('El descriptor facial debe tener exactamente 128 valores');
    }
    await this.userRepo.update(userId, { faceDescriptor: JSON.stringify(descriptor) });
    return { saved: true };
  }

  // Returns { hasDescriptor, match } to distinguish between:
  // - No face saved (hasDescriptor: false) → allow login with password only
  // - Face saved but no match (hasDescriptor: true, match: false) → reject
  // - Face saved and matches (hasDescriptor: true, match: true) → allow
  async verifyDescriptor(
    userId: number,
    incoming: number[],
  ): Promise<{ hasDescriptor: boolean; match: boolean }> {
    if (incoming.length !== 128) {
      throw new BadRequestException('El descriptor facial entrante debe tener exactamente 128 valores');
    }
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.faceDescriptor) return { hasDescriptor: false, match: false };

    const stored: number[] = JSON.parse(user.faceDescriptor);
    const match = this.euclideanDistance(stored, incoming) < this.THRESHOLD;
    return { hasDescriptor: true, match };
  }

  // Face-only login: scans all stored descriptors to find a match.
  // Returns the matched user (without password) or throws UnauthorizedException.
  async findUserByFace(incoming: number[]): Promise<Omit<User, 'password'>> {
    if (incoming.length !== 128) {
      throw new BadRequestException('Descriptor facial inválido');
    }
    const users = await this.userRepo.find({
      where: { faceDescriptor: Not(IsNull()), isActive: true },
    });

    let bestMatch: User | null = null;
    let bestDistance = Infinity;

    for (const user of users) {
      const stored: number[] = JSON.parse(user.faceDescriptor!);
      const dist = this.euclideanDistance(stored, incoming);
      if (dist < this.THRESHOLD && dist < bestDistance) {
        bestMatch = user;
        bestDistance = dist;
      }
    }

    if (!bestMatch) {
      throw new UnauthorizedException('Rostro no reconocido. Asegúrate de haber registrado tu cara en tu perfil.');
    }

    const { password, ...result } = bestMatch;
    return result as Omit<User, 'password'>;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}
