import { IsString, IsNumber, IsOptional, IsUrl, IsIn, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsNumber() @Min(1) @IsOptional() duration?: number;
  @IsIn(['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure']) @IsOptional() category?: string;
  @IsUrl() @IsOptional() imageUrl?: string;
}
