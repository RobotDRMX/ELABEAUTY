import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class CreateHairstyleDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() process!: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() category?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
