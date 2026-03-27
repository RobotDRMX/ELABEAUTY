import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNailDesignDto {
  @ApiProperty({ example: 'French Tips' }) @IsString() name!: string;
  @ApiProperty({ example: 'Diseño clásico francés' }) @IsString() description!: string;
  @ApiProperty({ example: 'Preparar, aplicar base, pintar puntas, sellar' }) @IsString() process!: string;
  @ApiPropertyOptional({ example: '60 min' }) @IsString() @IsOptional() duration?: string;
  @ApiPropertyOptional({ example: 400 }) @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiPropertyOptional({ example: 'Clásico' }) @IsString() @IsOptional() style?: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/french.jpg' }) @IsUrl() @IsOptional() image_url?: string;
}
