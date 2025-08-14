import { Optional } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsBoolean, MinLength } from 'class-validator';



export class UpdatePersonelDto {
  @IsNotEmpty({ message: 'Personel ID zorunludur' })
  @IsNumber({}, { message: 'Personel ID number türünde olmalıdır' })
  PersonelID: number;

  @IsNotEmpty({ message: 'Ad Soyad zorunludur' })
  @IsString({ message: 'Ad Soyad string olmalıdır' })
  AdSoyad: string;

  @IsNotEmpty({ message: 'TCNo zorunludur' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'TCNo numara türünde olmalıdır' })
  TCNo: number;

  @IsNotEmpty({ message: 'Iliski ID zorunludur' })
  @IsNumber({}, { message: 'Iliski ID number türünde olmalıdır' })
  IliskiID: number;

  @IsOptional()
  @IsNumber({}, { message: 'Kullaniıcı ID number türünde olmalıdır' })
  KullaniciID: number;

  @IsOptional()
  @IsString({ message: 'Net Maaş string türünde olmalıdır' })
  NetMaas: string;

  @IsBoolean({ message: 'BilisimPersoneli boolean türünde olmalıdır' })
  BilisimPersoneli: boolean;

  @IsOptional()
  @IsString({ message: 'Mesai Baslangic string olmalıdır' })
  MesaiBaslangic: string;

  @IsOptional()
  @IsString({ message: 'Mesai Bitiş string olmalıdır' })
  MesaiBitis: string;

  @IsOptional()
  @IsNotEmpty({ message: 'İşe giriş tarihi zorunludur' })
  @IsString({ message: 'İşe giriş tarihi string olmalıdır' })
  IseGirisTarihi: string;

  @IsOptional()
  @IsString({ message: 'İşeten çıkış tarihi string olmalıdır' })
  IstenCikisTarihi: string;
}
