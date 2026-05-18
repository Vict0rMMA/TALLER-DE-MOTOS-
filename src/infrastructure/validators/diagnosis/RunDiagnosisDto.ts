import { IsString, IsOptional, MinLength, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class HistoryTurnDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class RunDiagnosisDto {
  @IsString()
  @MinLength(5, { message: 'Describe el problema con al menos 5 caracteres' })
  question!: string;

  @IsString()
  @IsOptional()
  motorcycleId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryTurnDto)
  history?: HistoryTurnDto[];
}
