import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, ValidateIf, MinLength, IsArray, ArrayMinSize, ValidateNested, IsNumber, IsBoolean } from 'class-validator';

export class CreateProjeRaporDto {
  @IsNotEmpty({ message: 'DonemID zorunludur' })
  @IsNumber()
  DonemID: number;

  @IsOptional()
  @IsNumber()
  ID: number;

  @IsNotEmpty({ message: 'KullaniciID zorunludur' })
  @IsNumber()
  KullaniciID: number;

  @IsNotEmpty({ message: 'Sıra no zorunludur' })
  @IsNumber()
  SiraNo: number;

  @IsOptional()
  @IsBoolean()
  BelgesizIslem: boolean;

  @IsOptional()
  @IsString()
  adim: string;

  @IsOptional()
  @IsString()
  belgeAdi: string;
}



export class IsOrtagiListData {
  @IsNotEmpty({ message: 'tcKimlikNo zorunludur' })
  @IsString()
  @MinLength(11)
  tcKimlikNo: string;
}