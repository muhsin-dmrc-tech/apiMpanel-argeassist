import { Optional } from '@nestjs/common';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';



export class UpdateFirmaDto {
  @Optional()
  @IsNumber({}, { message: 'Firma ID number türünde olmalıdır' })
  FirmaID: number;

  @IsNotEmpty({ message: 'Firma Adı zorunludur' })
  @IsString({ message: 'Firma Adı string olmalıdır' })
  FirmaAdi: string;

  @Optional()
  @IsString({ message: 'PortalLinki string olmalıdır' })
  PortalLinki: string;

  @Optional()
  @IsString({ message: 'PortalKullaniciAdi string olmalıdır' })
  PortalKullaniciAdi: string;

  @Optional()
  @IsString({ message: 'PortalSifre string olmalıdır' })
  PortalSifre: string;

  @IsNotEmpty({ message: 'Mesai Baslangic zorunludur' })
  @IsString({ message: 'Mesai Baslangic string olmalıdır' })
  MesaiBaslangic: string;

  @IsNotEmpty({ message: 'Mesai Bitiş zorunludur' })
  @IsString({ message: 'Mesai Bitiş string olmalıdır' })
  MesaiBitis: string;

  @IsNotEmpty({ message: 'Çalışma günleri zorunludur' })
  @IsString({ message: 'Çalışma günleri string olmalıdır' })
  CalismaGunleri: string;

  @Optional()
  @IsString({ message: 'WebSitesi string olmalıdır' })
  WebSitesi: string;

  @Optional()
  @IsString({ message: 'Linkedin string olmalıdır' })
  Linkedin: string;

  @Optional()
  @IsString({ message: 'Logo string olmalıdır' })
  Logo: string;

  @Optional()
  @IsString({ message: 'Sektor string olmalıdır' })
  Sektor: string;

  @Optional()
  @IsString({ message: 'KurulusYili string olmalıdır' })
  KurulusYili: string;

  @Optional()
  @IsNumber({}, { message: 'CalisanSayisi number türünde olmalıdır' })
  CalisanSayisi: number;

  @Optional()
  @IsString({ message: 'KisaTanitim string olmalıdır' })
  KisaTanitim: string;

  @Optional()
  @IsString({ message: 'FirmaAciklamasi string olmalıdır' })
  FirmaAciklamasi: string;

  @Optional()
  @IsString({ message: 'TemsilciAdi string olmalıdır' })
  TemsilciAdi: string;

  @Optional()
  @IsString({ message: 'TemsilciUnvani string olmalıdır' })
  TemsilciUnvani: string;

  @Optional()
  @IsString({ message: 'TemsilciEmail string olmalıdır' })
  TemsilciEmail: string;

  @Optional()
  @IsString({ message: 'TemsilciTelefon string olmalıdır' })
  TemsilciTelefon: string;



}
