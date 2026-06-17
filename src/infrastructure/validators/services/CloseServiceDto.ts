import { IsNumber, IsOptional, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseServiceDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  laborCost?: number;

  // --- Factura ---
  @IsString()
  @IsIn(['efectivo', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'otro'])
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsString()
  @IsOptional()
  warranty?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  discount?: number;
}
