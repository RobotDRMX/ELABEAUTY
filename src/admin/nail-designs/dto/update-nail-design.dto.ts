import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class UpdateNailDesignDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() process?: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() style?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
