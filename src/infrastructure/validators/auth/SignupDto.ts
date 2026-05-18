import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  workshopName!: string;

  @IsString()
  @IsOptional()
  workshopNit?: string;

  @IsString()
  @IsOptional()
  workshopPhone?: string;

  @IsString()
  @IsOptional()
  workshopAddress?: string;
}
