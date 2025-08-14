import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'E-posta adresi hatalı' })
  @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
  email: string;

  @IsString({ message: 'Token string olmalıdır' })
  @IsNotEmpty({ message: 'Token zorunludur' })
  token: string;

  @IsNotEmpty({ message: 'Şifre zorunludur' })
  @IsString({ message: 'Şifre string olmalıdır' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsString({ message: 'Şifre tekrarı string olmalıdır' })
  @IsNotEmpty({ message: 'Şifre tekrarı zorunludur' })
  @MinLength(6, { message: 'Şifre tekrarı en az 6 karakter olmalıdır' })
  password_confirmation: string;
}
