import { IsString, IsInt, IsIn, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { STOCK_MOVEMENT_TYPES, StockMovementType } from '../../../domain/entities/StockMovement';

export class StockMovementDto {
  @IsString()
  productId!: string;

  @IsIn(STOCK_MOVEMENT_TYPES)
  type!: StockMovementType;

  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  quantity!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
