import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNailDesignDto {
  @ApiPropertyOptional({ example: 'French Tips' }) @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional({ example: 'Descripción actualizada' }) @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ example: 'Proceso actualizado' }) @IsString() @IsOptional() process?: string;
  @ApiPropertyOptional({ example: '60 min' }) @IsString() @IsOptional() duration?: string;
  @ApiPropertyOptional({ example: 400 }) @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiPropertyOptional({ example: 'Clásico' }) @IsString() @IsOptional() style?: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/french.jpg' }) @IsUrl() @IsOptional() image_url?: string;
}
