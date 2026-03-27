import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHairstyleDto {
  @ApiProperty({ example: 'Corte Bob' }) @IsString() name!: string;
  @ApiProperty({ example: 'Corte clásico a la altura de la barbilla' }) @IsString() description!: string;
  @ApiProperty({ example: 'Lavar, cortar, secar y peinar' }) @IsString() process!: string;
  @ApiPropertyOptional({ example: '45 min' }) @IsString() @IsOptional() duration?: string;
  @ApiPropertyOptional({ example: 350 }) @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiPropertyOptional({ example: 'Cortes' }) @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/bob.jpg' }) @IsUrl() @IsOptional() image_url?: string;
}
