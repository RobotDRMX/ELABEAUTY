import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class CreateNailDesignDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() process!: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() style?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
