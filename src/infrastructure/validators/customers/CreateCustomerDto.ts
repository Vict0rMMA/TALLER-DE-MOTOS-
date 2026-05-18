import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  cedula?: string;

  @IsString()
  phone!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  optInWhatsapp?: boolean;
}
