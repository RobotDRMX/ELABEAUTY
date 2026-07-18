import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../../offers/entities/offer.entity';
import { CreateOfferDto } from '../../offers/dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { EventsService } from '../../events/events.service';

@Injectable()
export class AdminOffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly repo: Repository<Offer>,
    private readonly events: EventsService,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { is_active: true };
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { sort_order: 'ASC', created_at: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateOfferDto): Promise<Offer> {
    const offer = this.repo.create(dto);
    const saved = await this.repo.save(offer);
    this.events.emit('offers:updated');
    return saved;
  }

  async update(id: number, dto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.repo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException(`Oferta #${id} no encontrada`);
    Object.assign(offer, dto);
    const saved = await this.repo.save(offer);
    this.events.emit('offers:updated');
    return saved;
  }

  async deactivate(id: number): Promise<Offer> {
    const offer = await this.repo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException(`Oferta #${id} no encontrada`);
    if (!offer.is_active) throw new BadRequestException('La oferta ya está desactivada');
    offer.is_active = false;
    const saved = await this.repo.save(offer);
    this.events.emit('offers:updated');
    return saved;
  }

  async restore(id: number): Promise<Offer> {
    const offer = await this.repo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException(`Oferta #${id} no encontrada`);
    if (offer.is_active) throw new BadRequestException('La oferta ya está activa');
    offer.is_active = true;
    const saved = await this.repo.save(offer);
    this.events.emit('offers:updated');
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const offer = await this.repo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException(`Oferta #${id} no encontrada`);
    if (offer.is_active) {
      throw new BadRequestException(
        'Debes desactivar la oferta antes de eliminarla permanentemente',
      );
    }
    await this.repo.delete(id);
    this.events.emit('offers:updated');
    return { message: `Oferta #${id} eliminada permanentemente` };
  }
}
