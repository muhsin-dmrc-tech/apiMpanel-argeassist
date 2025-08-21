import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class HesaplamaDataDto {
  @IsNotEmpty({ message: 'Next id zorunludur' })
  @IsNumber()
  id: number;

  @IsNotEmpty({ message: 'Personel Adı zorunludur' })
  @IsString()
  PersonelAdi: string;

  @IsNotEmpty({ message: 'Hesaplanacak tutar zorunludur' })
  @IsString()
  GirilenDeger: string;

  @IsString()
  KanunSecimi: 'standart' | '4691' | '5746';

  @IsString()
  UcretTuru: 'aylik' | 'gunluk';

  @IsString()
  HesaplamaSekli: 'netten-brute' | 'brutten-nete';

  @IsString()
  KumGelirVergiMatrahi: string;

  @IsString()
  AsgUcretKumIstisnaMatrahi: string;

  @IsNumber()
  Yil: number;

  @IsString()
  BaslangicAyi: string;

  @IsNumber()
  KacAylikBordro: number;

  @IsNumber()
  BordroGunSayisi: number;

  @IsBoolean()
  SirketOrtagi: boolean;

  @IsNumber()
  TeknoparkGunSayisi: number;

  @IsNumber()
  ArgeGunSayisi: number;

  @IsString()
  EgitimDurumu: string;

  @IsBoolean()
  BesPuanlikIndirimUygula: boolean;

  @IsBoolean()
  DortPuanlikIndirimUygula: boolean;

  @IsBoolean()
  BESKesintisiUygula: boolean;

  @IsNumber()
  BesYuzdesi: number;

  @IsString()
  EngelliIndirimi: string;

  @IsString()
  SSKGrup: 'tum-sigorta-kollarina-tabi' | 's-g-destek-primine-tabi' | 's-g-destek-primine-tabi-eytli';

  @IsBoolean()
  SSKTesvigiUygula: boolean;

  @IsBoolean()
  AsgUcretIstisnaUygula: boolean;

}


export interface AylikBordroSonucData {
  Ay: string;
  BordroGunSayisi: number,
  TeknoGunSayisi: number,
  ArgeGunSayisi: number,
  KanunNo: string,
  BESOrani: number,
  BESKEsintisi: number,
  AylikBrutUcret: number,
  BrutUcret: number,
  SGKMatrahi: number,
  SGKIsciPayi: number,
  SGKIsverenPayi: number,
  SGK5510Tesvigi: number,
  SGK4691Tesvigi:number,
  SGKTesvigi: number,
  KalanSGKIsverenPrimi: number,
  IssizlikIsciPrimi: number,
  IssizlikIsverenPrimi: number,
  OdenecekSGKPrimi: number,
  GelirVergisiMatrahi: number,
  KumGelirVergisiMatrahi: number,
  GelirVergisi: number,
  AsgUcretIstisnaMatrahi: number,
  AsgUcretKumuleIstisnaMatrahi: number,
  AsgUcretVergiIstisnasi: number,
  GelirVergisiTesvigi: number,
  KalanGelirVergisi: number,
  AsgUcretDamgaVergiIstisnasi: number,
  DamgaVergisiTesvigi: number,
  OdenecekDamgaVergisi: number,
  NetMaasAGIHaric: number,
  NetOdenen: number,
  ToplamMaliyet: number,
  ToplamTesvik: number
}