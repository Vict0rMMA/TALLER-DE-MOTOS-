import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  category!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  compatibility?: string[];

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMin!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsString()
  @IsOptional()
  barcode?: string;
}
