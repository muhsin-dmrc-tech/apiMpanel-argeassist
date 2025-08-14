import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Ad Soyad string olmalıdır' })
  @IsNotEmpty({ message: 'Ad Soyad zorunludur' })
  fullName: string;

  @IsEmail({}, { message: 'E-posta adresi hatalı' })
  @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
  email: string;

  @IsNotEmpty({ message: 'Şifre zorunludur' })
  @IsString({ message: 'Şifre string olmalıdır' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsString({ message: 'Şifre tekrarı string olmalıdır' })
  @IsNotEmpty({ message: 'Şifre tekrarı zorunludur' })
  @MinLength(6, { message: 'Şifre tekrarı en az 6 karakter olmalıdır' })
  confirmPassword: string;
}
