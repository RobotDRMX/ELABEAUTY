import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminHairstylesService } from './admin-hairstyles.service';
import { CreateHairstyleDto } from './dto/create-hairstyle.dto';
import { UpdateHairstyleDto } from './dto/update-hairstyle.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/hairstyles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminHairstylesController {
  constructor(private readonly service: AdminHairstylesService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateHairstyleDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHairstyleDto) { return this.service.update(id, dto); }
  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id', ParseIntPipe) id: number) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
