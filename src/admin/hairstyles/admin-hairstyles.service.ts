import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hairstyle } from '../../hairstyles/hairstyles.module';
import { CreateHairstyleDto } from './dto/create-hairstyle.dto';
import { UpdateHairstyleDto } from './dto/update-hairstyle.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { EventsService } from '../../events/events.service';

@Injectable()
export class AdminHairstylesService {
  constructor(
    @InjectRepository(Hairstyle)
    private readonly repo: Repository<Hairstyle>,
    private readonly events: EventsService,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { is_available: true };
    const [data, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateHairstyleDto): Promise<Hairstyle> {
    const saved = await this.repo.save(this.repo.create(dto));
    this.events.emit('hairstyles:updated');
    return saved;
  }

  async update(id: number, dto: UpdateHairstyleDto): Promise<Hairstyle> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    Object.assign(item, dto);
    const saved = await this.repo.save(item);
    this.events.emit('hairstyles:updated');
    return saved;
  }

  async deactivate(id: number): Promise<Hairstyle> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    if (!item.is_available) throw new BadRequestException('El peinado ya está desactivado');
    item.is_available = false;
    const saved = await this.repo.save(item);
    this.events.emit('hairstyles:updated');
    return saved;
  }

  async restore(id: number): Promise<Hairstyle> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    if (item.is_available) throw new BadRequestException('El peinado ya está activo');
    item.is_available = true;
    const saved = await this.repo.save(item);
    this.events.emit('hairstyles:updated');
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    if (item.is_available) {
      throw new BadRequestException('Desactiva el peinado antes de eliminarlo permanentemente');
    }
    await this.repo.delete(id);
    this.events.emit('hairstyles:updated');
    return { message: `Peinado #${id} eliminado permanentemente` };
  }
}
