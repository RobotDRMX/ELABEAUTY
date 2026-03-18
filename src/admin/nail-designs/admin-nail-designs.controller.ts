import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminNailDesignsService } from './admin-nail-designs.service';
import { CreateNailDesignDto } from './dto/create-nail-design.dto';
import { UpdateNailDesignDto } from './dto/update-nail-design.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/nail-designs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminNailDesignsController {
  constructor(private readonly service: AdminNailDesignsService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateNailDesignDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNailDesignDto) { return this.service.update(id, dto); }
  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id', ParseIntPipe) id: number) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
