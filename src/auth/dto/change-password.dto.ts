import {
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Eski şifre zorunludur' })
  oldPassword: string;


  @IsNotEmpty({ message: 'Yeni şifre zorunludur' })
  @IsString({ message: 'Yeni şifre string olmalıdır' })
  @MinLength(6, { message: 'Yeni şifre en az 6 karakter olmalıdır' })
  newPassword: string;


  @IsNotEmpty({ message: 'Yeni şifre tekrarı zorunludur' })
  @IsString({ message: 'Yeni şifre tekrarı string olmalıdır' })
  @MinLength(6, { message: 'Yeni şifre tekrarı en az 6 karakter olmalıdır' })
  confirmPassword: string;

}
