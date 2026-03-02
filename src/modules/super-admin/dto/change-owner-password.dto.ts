import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangeOwnerPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128)
  newPassword: string;
}
