import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsEmail,
  IsIP,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class CreateUserLoginDto {
  @IsIP()
  ipAddress: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9\s]+ on [a-zA-Z0-9\s]+$/, {
    message:
      'deviceInfo must be in the format "Browser on OS" (e.g., "Chrome on Windows")',
  })
  deviceInfo: string;

  @IsString()
  @IsEnum(['google', 'facebook', 'linkedin', 'microsoft', 'email'], {
    message: 'authProvider must be one of: google, facebook, linkedin, email',
  })
  authProvider: string;

  @IsBoolean()
  isSuccess: boolean;

  @IsString()
  @IsOptional()
  failureReason: string;
}
