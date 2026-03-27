import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
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

    const adminPassword = this.configService.get<string>('ADMIN_SEED_PASSWORD', 'Admin@Ela2026');
    const adminEmail = this.configService.get<string>('ADMIN_SEED_EMAIL', 'admin@elabeauty.com');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = this.userRepo.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      apellidoPaterno: 'ELA',
      apellidoMaterno: 'Beauty',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    await this.userRepo.save(admin);

    return {
      message: 'Administrador creado. Cambia la contrasena despues del primer login.',
      email: adminEmail,
    };
  }
}
