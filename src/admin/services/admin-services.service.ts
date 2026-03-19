import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { isActive: true };
    const [data, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async deactivate(id: string): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    if (!item.isActive) throw new BadRequestException('El servicio ya está desactivado');
    item.isActive = false;
    return this.repo.save(item);
  }

  async restore(id: string): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    if (item.isActive) throw new BadRequestException('El servicio ya está activo');
    item.isActive = true;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<{ message: string }> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    if (item.isActive) {
      throw new BadRequestException('Desactiva el servicio antes de eliminarlo permanentemente');
    }
    await this.repo.delete(id);
    return { message: `Servicio eliminado permanentemente` };
  }
}
