import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { isActive: true };
    const [rawData, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { createdAt: 'DESC' },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });
    return { data: rawData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateRole(id: number, role: string): Promise<Omit<User, 'password'>> {
    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException('Rol inválido. Valores permitidos: user, admin');
    }
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    user.role = role;
    const saved = await this.repo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async deactivate(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    if (!user.isActive) throw new BadRequestException('El usuario ya está desactivado');
    if (user.role === 'admin') {
      const adminCount = await this.repo.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) throw new BadRequestException('No puedes desactivar el único administrador activo');
    }
    user.isActive = false;
    await this.repo.save(user);
    return { message: `Usuario #${id} desactivado` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    if (user.isActive) throw new BadRequestException('El usuario ya está activo');
    user.isActive = true;
    await this.repo.save(user);
    return { message: `Usuario #${id} restaurado` };
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    if (user.isActive) {
      throw new BadRequestException('Desactiva el usuario antes de eliminarlo permanentemente');
    }
    if (user.role === 'admin') {
      throw new BadRequestException('No se puede eliminar permanentemente a un administrador');
    }
    await this.repo.delete(id);
    return { message: `Usuario #${id} eliminado permanentemente` };
  }
}
