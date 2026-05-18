import { IsString, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceProductItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;
}

export class CreateServiceDto {
  @IsString()
  motorcycleId!: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  mechanicId?: string;

  @IsString()
  type!: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceProductItemDto)
  @IsOptional()
  products?: ServiceProductItemDto[];
}
