import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.faceDescriptor) return { hasDescriptor: false, match: false };

    const stored: number[] = JSON.parse(user.faceDescriptor);
    const match = this.euclideanDistance(stored, incoming) < this.THRESHOLD;
    return { hasDescriptor: true, match };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}
