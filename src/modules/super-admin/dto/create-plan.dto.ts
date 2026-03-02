import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

enum PlanType {
  TRIAL = 'TRIAL',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsEnum(PlanType)
  type: PlanType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxEstablishments: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxProfessionals: number;

  @Type(() => Number)
  @IsNumber()
  maxAppointments: number;

  @IsObject()
  features: Record<string, boolean>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
