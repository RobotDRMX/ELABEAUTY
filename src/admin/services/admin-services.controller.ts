import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminServicesService } from './admin-services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminServicesController {
  constructor(private readonly service: AdminServicesService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateServiceDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateServiceDto) { return this.service.update(id, dto); }
  @Patch(':id/deactivate') deactivate(@Param('id') id: string) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id') id: string) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id') id: string) { return this.service.remove(id); }
}
