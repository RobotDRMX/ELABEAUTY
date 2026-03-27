import { IsInt, IsPositive } from 'class-validator';

export class FavoriteParamDto {
  @IsInt()
  @IsPositive()
  productId!: number;
}
