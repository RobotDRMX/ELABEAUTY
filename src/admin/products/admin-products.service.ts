import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { is_active: true };
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async deactivate(id: number): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    if (!product.is_active) throw new BadRequestException('El producto ya está desactivado');
    product.is_active = false;
    return this.repo.save(product);
  }

  async restore(id: number): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    if (product.is_active) throw new BadRequestException('El producto ya está activo');
    product.is_active = true;
    return this.repo.save(product);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    if (product.is_active) {
      throw new BadRequestException(
        'Debes desactivar el producto antes de eliminarlo permanentemente',
      );
    }
    await this.repo.delete(id);
    return { message: `Producto #${id} eliminado permanentemente` };
  }
}
