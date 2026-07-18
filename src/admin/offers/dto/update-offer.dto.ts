import { IsString, IsUrl, IsOptional, IsNumber, IsDateString, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'Rebajas de Verano' }) @IsString() @IsOptional() title?: string;
  @ApiPropertyOptional({ example: 'Hasta 30% de descuento' }) @IsString() @IsOptional() subtitle?: string;
  @ApiPropertyOptional({ example: 'Válido en tienda y en línea.' }) @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/oferta.jpg' }) @IsUrl() @IsOptional() image_url?: string;
  @ApiPropertyOptional({ example: 'Ver ofertas' }) @IsString() @IsOptional() cta_label?: string;
  @ApiPropertyOptional({ example: '/ofertas' }) @IsString() @IsOptional() cta_link?: string;
  @ApiPropertyOptional({ example: '-30%' }) @IsString() @IsOptional() badge?: string;
  @ApiPropertyOptional({ example: 'verano' }) @IsString() @IsOptional() tag?: string;
  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' }) @IsDateString() @IsOptional() start_date?: string;
  @ApiPropertyOptional({ example: '2026-07-31T23:59:59.000Z' }) @IsDateString() @IsOptional() end_date?: string;
  @ApiPropertyOptional({ example: 0, minimum: 0 }) @IsNumber() @Min(0) @IsOptional() sort_order?: number;
  @ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional() is_active?: boolean;
}
