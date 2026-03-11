import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchProductDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string = 'created_at';

  @IsIn(['ASC', 'DESC'], { message: 'order debe ser ASC o DESC' })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  maxPrice?: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  onlyInStock?: boolean;

  @IsString()
  @IsOptional()
  targetAge?: string;
}