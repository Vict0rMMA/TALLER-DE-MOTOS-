import { IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { STOCK_MOVEMENT_TYPES, StockMovementType } from '../../../domain/entities/StockMovement';

export class StockMovementDto {
  @IsString()
  productId!: string;

  @IsIn(STOCK_MOVEMENT_TYPES)
  type!: StockMovementType;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
