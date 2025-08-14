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

class KartBilgiDto {
  @IsNotEmpty({ message: 'Kart sahibinin adı soyadı zorunludur' })
  @MinLength(6, { message: 'Kart sahibinin adı soyadı en az 5 karakterden oluşmalıdır.' })
  @IsString({ message: 'Kart sahibinin adı soyadı string olmalıdır' })
  AdSoyad: string;

  @IsNotEmpty({ message: 'IBAN zorunludur' })
  @MinLength(18, { message: 'IBAN en az 18 karakterden oluşmalıdır.' })
  @IsString({ message: 'IBAN string olmalıdır' })
  @Matches(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, { message: 'Geçerli bir IBAN giriniz' })
  Iban: string;

  @IsNotEmpty({ message: 'Son Kullanma Tarihi zorunludur' })
  @MinLength(5, { message: 'Son Kullanma Tarihi en az 5 karakterden oluşmalıdır.' })
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Son Kullanma Tarihi MM/YY formatında olmalıdır',
  })
  SonKullanmaTarihi: string;

  @IsNotEmpty({ message: 'CVC zorunludur' })
  @IsNumber({}, { message: 'CVC sayı olmalıdır' })
  @Type(() => Number) // String olarak gelse bile number'a çevirir
  Cvc: number;
}

class FaturaBilgiDto {
  @IsNotEmpty({ message: 'Firma adı zorunludur' })
  @MinLength(3, { message: 'Firma adı en az 3 karakterden oluşmalıdır.' })
  @IsString({ message: 'Firma adı string olmalıdır' })
  FirmaAdi: string;

  @IsNotEmpty({ message: 'Vergi/TC No zorunludur' })
  @MinLength(11, { message: 'Vergi/TC No en az 11 karakterden oluşmalıdır.' })
  VergiNo: string;

  @IsNotEmpty({ message: 'Vergi Dairesi zorunludur' })
  @MinLength(3, { message: 'Vergi Dairesi en az 3 karakterden oluşmalıdır.' })
  @IsString({ message: 'Vergi Dairesi string olmalıdır' })
  VergiDairesi: string;

  @IsNotEmpty({ message: 'Adres zorunludur' })
  @MinLength(10, { message: 'Adres en az 10 karakterden oluşmalıdır.' })
  @IsString({ message: 'Adres string olmalıdır' })
  Adres: string;

  @IsNotEmpty({ message: 'Sehir zorunludur' })
  @MinLength(3, { message: 'Sehir en az 3 karakterden oluşmalıdır.' })
  @IsString({ message: 'Sehir string olmalıdır' })
  Sehir: string;

  @IsNotEmpty({ message: 'Ilce zorunludur' })
  @MinLength(3, { message: 'Ilce en az 3 karakterden oluşmalıdır.' })
  @IsString({ message: 'Ilce string olmalıdır' })
  Ilce: string;

  @IsNotEmpty({ message: 'Telefon zorunludur' })
  @MinLength(11, { message: 'Telefon en az 11 karakterden oluşmalıdır.' })
  @IsString({ message: 'Telefon string olmalıdır' })
  Telefon: string;

  @IsNotEmpty({ message: 'Eposta zorunludur' })
  @MinLength(3, { message: 'Eposta en az 3 karakterden oluşmalıdır.' })
  @IsString({ message: 'Eposta string olmalıdır' })
  Eposta: string;

}

export class CreateOdemeDto {
  @IsObject()
  @ValidateNested()
  @Type(() => FaturaBilgiDto)
  faturaBilgi: FaturaBilgiDto;

  /* @IsObject()
  @ValidateNested()
  @Type(() => KartBilgiDto)
  kartBilgi: KartBilgiDto; */

  @IsNumber({}, { message: 'Siparis ID number türünde olmalıdır' })
  @Type(() => Number)
  SiparisID: number;


  @IsNotEmpty({ message: 'Ödeme Yöntemi zorunludur' })
  @MinLength(4, { message: 'Ödeme Yöntemi en az 4 karakterden oluşmalıdır.' })
  @IsString({ message: 'Ödeme Yöntemi string olmalıdır' })
  odemeYontemi: string;
}
