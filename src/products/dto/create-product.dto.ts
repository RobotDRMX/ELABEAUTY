import { IsString, IsNumber, IsUrl, IsOptional, Min, Max } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsUrl()
  @IsOptional()
  image_url?: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;
}