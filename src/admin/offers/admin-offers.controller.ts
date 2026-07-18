import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminOffersService } from './admin-offers.service';
import { CreateOfferDto } from '../../offers/dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin — Ofertas')
@ApiBearerAuth()
@Controller('admin/offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOffersController {
  constructor(private readonly service: AdminOffersService) {}

  @Get()
  findAll(@Query() dto: AdminListDto) {
    return this.service.findAll(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOfferDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOfferDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
