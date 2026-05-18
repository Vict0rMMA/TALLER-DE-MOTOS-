import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMotorcycleDto {
  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @Min(50)
  @Max(1200)
  @Type(() => Number)
  @IsOptional()
  cc?: number;

  @IsNumber()
  @Min(1990)
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  kmCurrent?: number;
}
