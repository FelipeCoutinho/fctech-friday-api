import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxEstablishments?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxProfessionals?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAppointments?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
