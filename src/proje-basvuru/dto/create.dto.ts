import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';


export class CreateBasvuruDto {
  @IsNotEmpty({ message: 'Firma ID zorunludur' })
  @IsNumber({}, { message: 'Firma ID number türünde olmalıdır' })
  FirmaID: number;

  @IsNotEmpty({ message: 'Teknokent ID zorunludur' })
  @IsNumber({}, { message: 'Teknokent ID number türünde olmalıdır' })
  TeknokentID: number;

  @IsNotEmpty({ message: 'Önerilen Proje İsmi zorunludur' })
  @IsString({ message: 'Önerilen Proje İsmi string olmalıdır' })
  OnerilenProjeIsmi: string;

  @IsNotEmpty({ message: 'Proje Konusu Ve Amacı zorunludur' })
  @IsString({ message: 'Proje Konusu Ve Amacı string olmalıdır' })
  ProjeKonusuVeAmaci: string;

  @IsNotEmpty({ message: 'Projeyi Ortaya Çıkaran Problem zorunludur' })
  @IsString({ message: 'Projeyi Ortaya Çıkaran Problem string olmalıdır' })
  ProjeyiOrtayaCikaranProblem: string;

  @IsNotEmpty({ message: 'Proje Kapsamindaki Cözüm zorunludur' })
  @IsString({ message: 'Proje Kapsamindaki Cözüm string olmalıdır' })
  ProjeKapsamindakiCozum: string;

  /* @IsNotEmpty({ message: 'Kullanilacak Teknolojiler Ve Yöntemler zorunludur' })
  @IsString({ message: 'Kullanilacak Teknolojiler Ve Yöntemler string olmalıdır' })
  KullanilacakTeknolojilerVeYontemler: string; */

  @IsNotEmpty({ message: 'Projenin İçerdiği Yenilikler zorunludur' })
  @IsString({ message: 'Projenin İçerdiği Yenilikler string olmalıdır' })
  ProjeninIcerdigiYenilikler: string;

  @IsOptional()
  @IsString({ message: 'Rakip Analizi string olmalıdır' })
  RakipAnalizi?: string;

  @IsNotEmpty({ message: 'Ticari Başarı Potansiyeli zorunludur' })
  @IsString({ message: 'Ticari Başarı Potansiyeli string olmalıdır' })
  TicariBasariPotansiyeli: string;
/* 
  @IsNotEmpty({ message: 'Satış Stratejileri zorunludur' })
  @IsString({ message: 'Satış Stratejileri string olmalıdır' })
  SatisStratejileri: string; */

}