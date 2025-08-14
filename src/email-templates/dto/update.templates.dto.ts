import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTemplatesDto {
  @IsNotEmpty({ message: 'Şablon ID zorunludur' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({},{ message: 'Şablon ID number türünde olmalıdır' })
  emailTemplateId: number;

  @IsNotEmpty({ message: 'Şablon adı zorunludur' })
  @IsString({ message: 'Şablon adı string olmalıdır' })
  @MinLength(3, { message: 'Şablon adı alanı en az 3 karakter olmalıdır' })
  @MaxLength(255, { message: 'Şablon adı alanı en fazla 255 karakter olmalıdır' })
  templateName: string;

  @IsNotEmpty({ message: 'Konu zorunludur' })
  @IsString({ message: 'Konu string olmalıdır' })
  @MinLength(3, { message: 'Konu alanı en az 3 karakter olmalıdır' })
  @MaxLength(255, { message: 'Konu alanı en fazla 255 karakter olmalıdır' })
  subject: string;

  @IsNotEmpty({ message: 'Body zorunludur' })
  @IsString({ message: 'Body string olmalıdır' })
  @MinLength(3, { message: 'Body alanı en az 3 karakter olmalıdır' })
  @MaxLength(8000, { message: 'Body alanı en fazla 8000 karakter olmalıdır' })
  body: string;
}
