import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum TenantUserRole {
  CLIENT = 'CLIENT',
  BARBER = 'BARBER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export class UpdateTenantUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsEnum(TenantUserRole)
  role?: TenantUserRole;
}
