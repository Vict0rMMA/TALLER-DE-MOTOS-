import { IsString, IsEmail, IsOptional, IsBoolean, Matches } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cedula?: string;

  @IsString()
  @Matches(/^\+?57[0-9]{10}$/, { message: 'phone debe ser un número colombiano válido (+573XXXXXXXXX)' })
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  optInWhatsapp?: boolean;
}
