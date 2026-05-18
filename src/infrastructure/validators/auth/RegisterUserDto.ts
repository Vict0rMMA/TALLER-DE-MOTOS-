import { IsEmail, IsString, MinLength, IsIn, IsOptional } from 'class-validator';
import { USER_ROLES, UserRole } from '../../../domain/entities/User';

export class RegisterUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsIn(USER_ROLES)
  @IsOptional()
  role?: UserRole;

  @IsString()
  workshopId!: string;
}
