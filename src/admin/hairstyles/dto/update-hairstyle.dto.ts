import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHairstyleDto {
  @ApiPropertyOptional({ example: 'Corte Bob' }) @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional({ example: 'Descripción actualizada' }) @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ example: 'Proceso actualizado' }) @IsString() @IsOptional() process?: string;
  @ApiPropertyOptional({ example: '45 min' }) @IsString() @IsOptional() duration?: string;
  @ApiPropertyOptional({ example: 350 }) @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiPropertyOptional({ example: 'Cortes' }) @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/bob.jpg' }) @IsUrl() @IsOptional() image_url?: string;
}
