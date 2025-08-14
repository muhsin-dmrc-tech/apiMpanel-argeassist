import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateFaturaDto {
  @IsNotEmpty({message:'Firma ID zorunludur'})
  @IsNumber({}, { message: 'Firma ID number türünde olmalıdır' })
  FirmaID: number;

  @IsNotEmpty({message:'Abonelik ID zorunludur'})
  @IsNumber({}, { message: 'Abonelik ID number türünde olmalıdır' })
  AbonelikID: number;

  @IsNotEmpty({message:'Kullanici ID zorunludur'})
  @IsNumber({}, { message: 'Kullanici ID number türünde olmalıdır' })
  KullaniciID: number;

  @IsNotEmpty({message:'Fatura Bilgi ID zorunludur'})
  @IsNumber({}, { message: 'Fatura Bilgi ID number türünde olmalıdır' })
  FaturaBilgiID: number;

  @IsNotEmpty({ message: 'Fiyat zorunludur' })
  @IsString({ message: 'Fiyat string olmalıdır' })
  @MinLength(2, { message: 'Fiyat alanı en az 2 karakter olmalıdır' })
  @MaxLength(12, { message: 'Fiyat alanı en fazla 12 karakter olmalıdır' })
  Tutar: string;
}
