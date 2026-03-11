import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { JwtAuthGuard } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Solo admin puede crear productos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('search')
  search(@Query() searchDto: SearchProductDto) {
    return this.productsService.search(searchDto);
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('featured')
  getFeaturedProducts(@Query('limit') limit: number = 8) {
    return this.productsService.getFeaturedProducts(limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // Solo admin puede ejecutar seed
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  seedProducts() {
    return this.productsService.seedProducts();
  }
}
