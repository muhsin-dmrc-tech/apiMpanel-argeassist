import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateDto {
  @IsNotEmpty({ message: 'TeknokentID zorunludur' })
  @IsNumber()
  TeknokentID: number;

  @IsNotEmpty({ message: 'Teknokent adı zorunludur' })
  @IsString()
  TeknokentAdi: string;

  @IsOptional()
  @IsString()
  Il: string;

  @IsOptional()
  @IsString()
  Ilce: string;

  @IsOptional()
  @IsNumber()
  KullaniciID: number;

  @IsOptional()
  @IsString()
  Adres?: string;

  @IsOptional()
  @IsString()
  Telefon?: string;

  @IsOptional()
  @IsString()
  Eposta?: string;

  @IsOptional()
  @IsString()
  WebSitesi?: string;

  @IsOptional()
  @IsString()
  KisaTanitim?: string;

  @IsOptional()
  @IsString()
  FirmaAciklamasi?: string;

  @IsOptional()
  @IsNumber()
  BilgiID?: number;

  @IsOptional()
  @IsString()
  TemsilciAdi?: string;

  @IsOptional()
  @IsString()
  TemsilciUnvani?: string;

  @IsOptional()
  @IsString()
  TemsilciEmail?: string;

  @IsOptional()
  @IsString()
  TemsilciTelefon?: string;
}