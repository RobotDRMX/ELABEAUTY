import { IsString, IsNumber, IsOptional, IsUrl, IsIn, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Facial Hidratante' }) @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional({ example: 'Descripción actualizada' }) @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ example: 699.99 }) @IsNumber() @Min(0) @IsOptional() price?: number;
  @ApiPropertyOptional({ example: 90 }) @IsNumber() @Min(1) @IsOptional() duration?: number;
  @ApiPropertyOptional({ enum: ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'] }) @IsIn(['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure']) @IsOptional() category?: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/facial.jpg' }) @IsUrl() @IsOptional() imageUrl?: string;
}
