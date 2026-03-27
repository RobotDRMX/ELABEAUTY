import { IsString, IsNumber, IsUrl, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Shampoo Reparador' }) @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional({ example: 'Descripción actualizada' }) @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ example: 349.99 }) @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiPropertyOptional({ example: 'Cuidado Capilar' }) @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional({ example: 'Shampoos' }) @IsString() @IsOptional() subcategory?: string;
  @ApiPropertyOptional({ example: 100 }) @IsNumber() @Min(0) @IsOptional() stock?: number;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/img.jpg' }) @IsUrl() @IsOptional() image_url?: string;
  @ApiPropertyOptional({ example: 4.5 }) @IsNumber() @Min(0) @Max(5) @IsOptional() rating?: number;
  @ApiPropertyOptional({ example: 'adultos' }) @IsString() @IsOptional() target_age?: string;
}
