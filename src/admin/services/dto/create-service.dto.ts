import { IsString, IsNumber, IsOptional, IsUrl, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const SERVICE_CATEGORIES = ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'] as const;

export class CreateServiceDto {
  @ApiProperty({ example: 'Facial Hidratante' }) @IsString() name!: string;
  @ApiProperty({ example: 'Tratamiento facial con ácido hialurónico' }) @IsString() description!: string;
  @ApiProperty({ example: 599.99 }) @IsNumber() @Min(0) price!: number;
  @ApiProperty({ example: 60, description: 'Duración en minutos' }) @IsNumber() @Min(1) duration!: number;
  @ApiProperty({ enum: SERVICE_CATEGORIES, example: 'facial' }) @IsIn(SERVICE_CATEGORIES) category!: string;
  @ApiPropertyOptional({ example: 'https://ejemplo.com/facial.jpg' }) @IsUrl() @IsOptional() imageUrl?: string;
}
