import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Endpoint de primer uso — crea admin si no existe ninguno
  // No requiere auth (primer arranque del sistema)
  @Post('seed-admin')
  @HttpCode(HttpStatus.CREATED)
  seedAdmin() {
    return this.adminService.seedAdmin();
  }
}
