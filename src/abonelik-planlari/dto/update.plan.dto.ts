import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePlanDto {
  @IsNotEmpty({ message: 'Abonelik Plan ID zorunludur' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({},{ message: 'Abonelik Plan ID number türünde olmalıdır' })
  AbonelikPlanID: number;

  @IsNotEmpty({ message: 'Plan adı zorunludur' })
  @IsString({ message: 'Plan adı string olmalıdır' })
  @MinLength(2, { message: 'Plan adı alanı en az 2 karakter olmalıdır' })
  @MaxLength(255, { message: 'Plan adı alanı en fazla 255 karakter olmalıdır' })
  PlanAdi: string;

  @IsNotEmpty({ message: 'Fiyat zorunludur' })
  @IsString({ message: 'Fiyat string olmalıdır' })
  @MinLength(2, { message: 'Fiyat alanı en az 2 karakter olmalıdır' })
  @MaxLength(12, { message: 'Fiyat alanı en fazla 12 karakter olmalıdır' })
  Fiyat: string;

  @IsNotEmpty({ message: 'Açıklama zorunludur' })
  @IsString({ message: 'Açıklama string olmalıdır' })
  @MinLength(3, { message: 'Açıklama alanı en az 3 karakter olmalıdır' })
  @MaxLength(2000, { message: 'Açıklama alanı en fazla 2000 karakter olmalıdır' })
  Aciklama: string;
}
