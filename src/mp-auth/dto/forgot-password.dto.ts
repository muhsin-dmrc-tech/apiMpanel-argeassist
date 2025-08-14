import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'E-posta adresi hatalı' })
  email: string;
}
