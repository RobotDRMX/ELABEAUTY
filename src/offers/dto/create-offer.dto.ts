import { IsString, IsInt, IsPositive, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ example: 'Rebajas de Verano' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Hasta 30% de descuento en cuidado capilar' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Válido en tienda y en línea, del 1 al 31 de julio.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID del producto en oferta (se usa su imagen y precio)' })
  @IsInt()
  @IsPositive()
  product_id!: number;

  @ApiPropertyOptional({ example: 'Ver ofertas' })
  @IsString()
  @IsOptional()
  cta_label?: string;

  @ApiPropertyOptional({ example: '/ofertas' })
  @IsString()
  @IsOptional()
  cta_link?: string;

  @ApiPropertyOptional({ example: '-30%' })
  @IsString()
  @IsOptional()
  badge?: string;

  @ApiPropertyOptional({ example: 'verano' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2026-07-31T23:59:59.000Z' })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sort_order?: number;
}
