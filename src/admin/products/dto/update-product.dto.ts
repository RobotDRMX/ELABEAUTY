import { IsString, IsNumber, IsUrl, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class UpdateProductDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() subcategory?: string;
  @IsNumber() @Min(0) @IsOptional() stock?: number;
  @IsUrl() @IsOptional() image_url?: string;
  @IsNumber() @Min(0) @Max(5) @IsOptional() rating?: number;
  @IsString() @IsOptional() target_age?: string;
}
