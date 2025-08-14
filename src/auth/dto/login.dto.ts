import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-posta adresi hatalı' })
  @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
  email: string;

  @IsNotEmpty({ message: 'Şifre zorunludur' })
  @IsString({ message: 'Şifre string olmalıdır' })
  password: string;

}
