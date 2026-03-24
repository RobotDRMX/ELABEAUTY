import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NailDesign } from '../../nail-designs/nail-designs.module';
import { CreateNailDesignDto } from './dto/create-nail-design.dto';
import { UpdateNailDesignDto } from './dto/update-nail-design.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { EventsService } from '../../events/events.service';

@Injectable()
export class AdminNailDesignsService {
  constructor(
    @InjectRepository(NailDesign)
    private readonly repo: Repository<NailDesign>,
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

  async create(dto: CreateNailDesignDto): Promise<NailDesign> {
    const saved = await this.repo.save(this.repo.create(dto));
    this.events.emit('nail-designs:updated');
    return saved;
  }

  async update(id: number, dto: UpdateNailDesignDto): Promise<NailDesign> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    Object.assign(item, dto);
    const saved = await this.repo.save(item);
    this.events.emit('nail-designs:updated');
    return saved;
  }

  async deactivate(id: number): Promise<NailDesign> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    if (!item.is_available) throw new BadRequestException('El diseño ya está desactivado');
    item.is_available = false;
    const saved = await this.repo.save(item);
    this.events.emit('nail-designs:updated');
    return saved;
  }

  async restore(id: number): Promise<NailDesign> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    if (item.is_available) throw new BadRequestException('El diseño ya está activo');
    item.is_available = true;
    const saved = await this.repo.save(item);
    this.events.emit('nail-designs:updated');
    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    if (item.is_available) {
      throw new BadRequestException('Desactiva el diseño antes de eliminarlo permanentemente');
    }
    await this.repo.delete(id);
    this.events.emit('nail-designs:updated');
    return { message: `Diseño #${id} eliminado permanentemente` };
  }
}
