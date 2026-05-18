import { IsString, IsNumber, IsOptional, IsArray, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  compatibility?: string[];

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stockMin?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  cost?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
