import { IsNotEmpty, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';


export class CreateFirmaDto {
  @IsString({ message: 'FirmaAdi string olmalıdır' })
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

  @IsNotEmpty({message:'Mesai Baslangic zorunludur'})
  @IsString({ message: 'Mesai Baslangic string olmalıdır' })
  MesaiBaslangic: string;

  @IsNotEmpty({message:'Mesai Bitiş zorunludur'})
  @IsString({ message: 'Mesai Bitiş string olmalıdır' })
  MesaiBitis: string;

  @IsNotEmpty({message:'Çalışma günleri zorunludur'})
  @IsString({ message: 'Çalışma günleri string olmalıdır' })
  CalismaGunleri: string;

}