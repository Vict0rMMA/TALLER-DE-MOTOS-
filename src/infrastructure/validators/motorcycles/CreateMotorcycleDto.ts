import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMotorcycleDto {
  @IsString()
  customerId!: string;

  @IsString()
  placa!: string;

  @IsString()
  brand!: string;

  @IsString()
  model!: string;

  @IsNumber()
  @Min(50)
  @Max(2000)
  @Type(() => Number)
  @IsOptional()
  cc?: number;

  @IsNumber()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  kmCurrent?: number;
}
