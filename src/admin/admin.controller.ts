import { Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  @Post('seed-admin')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ global: { limit: 1, ttl: 3600000 } })
  seedAdmin(@Body('secret') secret: string) {
    const expected = this.configService.get<string>('ADMIN_SEED_SECRET');
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Clave de seed invalida');
    }
    return this.adminService.seedAdmin();
  }
}
