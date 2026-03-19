import { IsString, IsNumber, IsOptional, IsUrl, IsIn, Min } from 'class-validator';

const SERVICE_CATEGORIES = ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'] as const;

export class CreateServiceDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsNumber() @Min(0) price!: number;
  @IsNumber() @Min(1) duration!: number;
  @IsIn(SERVICE_CATEGORIES) category!: string;
  @IsUrl() @IsOptional() imageUrl?: string;
}
