import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTemplatesDto {
  @IsNotEmpty({ message: 'Baslik zorunludur' })
  @IsString({ message: 'Baslik string olmalıdır' })
  @MinLength(3, { message: 'Baslik alanı en az 3 karakter olmalıdır' })
  @MaxLength(255, { message: 'Baslik alanı en fazla 255 karakter olmalıdır' })
  Baslik: string;

  @IsOptional()
  @IsString({ message: 'Anahtar string olmalıdır' })
  @MinLength(3, { message: 'Anahtar alanı en az 3 karakter olmalıdır' })
  @MaxLength(100, { message: 'Anahtar alanı en fazla 100 karakter olmalıdır' })
  Anahtar: string;

  @IsOptional()
  @IsString({ message: 'Link string olmalıdır' })
  @MinLength(3, { message: 'Link alanı en az 3 karakter olmalıdır' })
  @MaxLength(255, { message: 'Link alanı en fazla 255 karakter olmalıdır' })
  Link: string;

  @IsOptional()
  @IsString({ message: 'Mobil Link string olmalıdır' })
  @MinLength(3, { message: 'Mobil Link alanı en az 3 karakter olmalıdır' })
  @MaxLength(255, { message: 'Mobil Link alanı en fazla 255 karakter olmalıdır' })
  MobilLink: string;

  @IsNotEmpty({ message: 'Tür zorunludur' })
  @IsString({ message: 'Tür string olmalıdır' })
  @MinLength(4, { message: 'Tür alanı en az 3 karakter olmalıdır' })
  @MaxLength(50, { message: 'Tür alanı en fazla 50 karakter olmalıdır' })
  Tur: string;

  @IsNotEmpty({ message: 'Body zorunludur' })
  @IsString({ message: 'Body string olmalıdır' })
  @MinLength(3, { message: 'Body alanı en az 3 karakter olmalıdır' })
  @MaxLength(2000, { message: 'Body alanı en fazla 2000 karakter olmalıdır' })
  Icerik: string;
  
  @IsBoolean({ message: 'Tum Kullanicilar true yada false olmalıdır' })
  TumKullanicilar: boolean;

  @IsBoolean({ message: 'Hemen Gonder true yada false olmalıdır' })
  HemenGonder: boolean;

  @IsOptional()
  PlanlananTarih: string;
}
