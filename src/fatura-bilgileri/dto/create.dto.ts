import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';


export class CreateFaturaBilgiDto {
  @IsNotEmpty({message:'Firma adı zorunludur'})
  @IsString({ message: 'Firma adı string olmalıdır' })
  FirmaAdi: string;

  @IsNotEmpty({message:'Vergi/TC No zorunludur'})
  VergiNo: string;

  @IsNotEmpty({message:'Firma ID zorunludur'})
  @IsNumber({}, { message: 'Firma ID number türünde olmalıdır' })
  FirmaID: number;

  @IsNotEmpty({message:'Vergi Dairesi zorunludur'})
  @IsString({ message: 'Vergi Dairesi string olmalıdır' })
  VergiDairesi: string;
  
  @IsNotEmpty({message:'Adres zorunludur'})
  @IsString({ message: 'Adres string olmalıdır' })
  Adres: string;

  @IsNotEmpty({message:'Sehir zorunludur'})
  @IsString({ message: 'Sehir string olmalıdır' })
  Sehir: string;

  @IsNotEmpty({message:'Ilce zorunludur'})
  @IsString({ message: 'Ilce string olmalıdır' })
  Ilce: string;

  @IsNotEmpty({message:'Telefon zorunludur'})
  @IsString({ message: 'Telefon string olmalıdır' })
  Telefon: string;

  @IsNotEmpty({message:'Eposta zorunludur'})
  @IsString({ message: 'Eposta string olmalıdır' })
  Eposta: string;

}