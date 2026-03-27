import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) { }

  @ApiOperation({ summary: 'Datos principales del home' })
  @Get()
  getHomeData() {
    return this.homeService.getHomeData();
  }

  @ApiOperation({ summary: 'Preview de servicios para el home' })
  @Get('services-preview')
  getServicesPreview() {
    return this.homeService.getServicesPreview();
  }
}