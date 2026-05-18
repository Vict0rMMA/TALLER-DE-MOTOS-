import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseServiceDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  laborCost?: number;
}
