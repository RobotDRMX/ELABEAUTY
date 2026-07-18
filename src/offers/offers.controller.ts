import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OffersService } from './offers.service';

@ApiTags('Ofertas')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @ApiOperation({ summary: 'Listar ofertas de temporada activas y vigentes' })
  @Get('active')
  findActive() {
    return this.offersService.findActive();
  }
}
