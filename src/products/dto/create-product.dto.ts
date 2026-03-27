import { IsString, IsNumber, IsUrl, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Shampoo Reparador' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Shampoo para cabello dañado con keratina' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 299.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'Cuidado Capilar' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: 'Shampoos' })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ example: 50, minimum: 0 })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/imagen.jpg' })
  @IsUrl()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ example: 4.5, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 'adultos' })
  @IsString()
  @IsOptional()
  target_age?: string;
}
