import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchProductDto {
  @ApiPropertyOptional({ example: 'shampoo', description: 'Texto de búsqueda' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ example: 'Cuidado Capilar' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'created_at', default: 'created_at' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsIn(['ASC', 'DESC'], { message: 'order debe ser ASC o DESC' })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ example: 100, minimum: 0 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ example: false, description: 'Solo productos en stock' })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  onlyInStock?: boolean;

  @ApiPropertyOptional({ example: 'adultos' })
  @IsString()
  @IsOptional()
  targetAge?: string;
}
