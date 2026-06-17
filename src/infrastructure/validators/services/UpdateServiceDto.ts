import { IsString, IsNumber, IsOptional, Min, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @IsString()
  @IsIn(['open', 'in_progress', 'closed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  laborCost?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  kmAtService?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  nextMaintenanceKm?: number;

  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;

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
