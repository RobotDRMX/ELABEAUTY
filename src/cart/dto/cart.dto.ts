import { IsInt, IsPositive, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @IsPositive()
  productId!: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;
}

export class UpdateCartQuantityDto {
  @ApiProperty({ example: 2, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  quantity!: number;
}
