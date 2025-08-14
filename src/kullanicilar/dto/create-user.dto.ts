import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'This field must be a string' })
  @IsNotEmpty({ message: 'This field cannot be left blank' })
  fullName: string;

  @IsEnum(['email', 'google', 'facebook', 'microsoft', 'linkedin'], {
    message: 'Please select a valid authentication provider',
  })
  @IsNotEmpty({ message: 'This field cannot be left blank' })
  authProvider: string;

  @IsString({ message: 'This field must be a string' })
  @IsOptional()
  providerUserId: string;

  @IsString({ message: 'This field must be a string' })
  @IsOptional()
  profilePicture: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'This field cannot be left blank' })
  isTwoFactorEnabled: boolean;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'This field cannot be left blank' })
  email: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.authProvider === 'email') // authProvider 'google' değilse kontrol yap
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.authProvider === 'email') // authProvider 'google' değilse kontrol yap
  @MinLength(6, {
    message: 'Password confirmation must be at least 6 characters long',
  })
  confirmPassword: string;

  @IsOptional()
  ipAddress: string;

  @IsOptional()
  deviceInfo: string;
}
