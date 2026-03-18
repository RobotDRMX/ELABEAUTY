import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async seedAdmin(): Promise<{ message: string; email: string }> {
    const existing = await this.userRepo.findOne({
      where: { role: 'admin', isActive: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un administrador activo. No se puede volver a ejecutar el seed.',
      );
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@Ela2026', salt);

    const admin = this.userRepo.create({
      email: 'admin@elabeauty.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'ELA Beauty',
      role: 'admin',
      isActive: true,
    });

    await this.userRepo.save(admin);

    return {
      message: 'Administrador creado. Cambia la contraseña después del primer login.',
      email: 'admin@elabeauty.com',
    };
  }
}
