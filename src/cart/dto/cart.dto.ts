import { IsInt, IsPositive, Min, Max, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;
}

export class UpdateCartQuantityDto {
  @IsInt()
  @Min(0)
  @Max(100)
  quantity!: number;
}
