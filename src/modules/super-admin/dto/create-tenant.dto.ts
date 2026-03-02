import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';

enum EstablishmentType {
  BARBERSHOP = 'BARBERSHOP',
  SALON = 'SALON',
  PETSHOP = 'PETSHOP',
}

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hifens',
  })
  slug: string;

  @IsEnum(EstablishmentType)
  @IsOptional()
  type?: EstablishmentType;

  @IsUUID()
  planId: string;

  @IsString()
  @MinLength(2)
  ownerName: string;

  @IsEmail()
  ownerEmail: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsString()
  @MinLength(5)
  establishmentAddress: string;
}
