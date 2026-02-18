import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpStatus,
  HttpCode 
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  seedProducts() {
    return this.productsService.seedProducts();
  }
}