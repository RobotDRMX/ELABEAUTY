import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly repo: Repository<Offer>,
  ) {}

  findActive(): Promise<Offer[]> {
    const now = new Date();
    return this.repo.find({
      where: {
        is_active: true,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
      relations: ['product'],
      order: { sort_order: 'ASC', created_at: 'DESC' },
    });
  }
}
