import {
  Controller, Get, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminListDto } from '../dto/admin-list.dto';
import { UpdateRoleDto } from '../../auth/dto/auth.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Patch(':id/role') updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) { return this.service.updateRole(id, dto.role); }
  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id', ParseIntPipe) id: number) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
