import { IsString, IsNumber, IsArray, ValidateNested, IsObject, IsBoolean, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class CheckedItemDto {
  @IsString({ message: 'Tarih string olmalıdır' })
  Tarih: string;

  @IsString({ message: 'Baslangıc string olmalıdır' })
  Baslangic: string;

  @IsString({ message: 'Bitiş string olmalıdır' })
  Bitis: string;

  @IsString({ message: 'Toplam süre string olmalıdır' })
  ToplamSure: string;

  @IsOptional()
  Aciklama: string;
}

class ItemValueDto {
  @IsNumber({}, { message: 'IzinTalep ID number türünde olmalıdır' })
  IzinTalepID: number;

  @IsNumber({}, { message: 'Firma ID number türünde olmalıdır' })
  FirmaID: number;

  @IsNumber({}, { message: 'Donem ID number türünde olmalıdır' })
  DonemID: number;

  @IsNumber({}, { message: 'IzinTuru ID number türünde olmalıdır' })
  IzinTuruID: number;

  @IsNumber({}, { message: 'Personel ID number türünde olmalıdır' })
  PersonelID: number;

  @IsOptional()
  Notlar: string;
}

class GunlerCheckedDto {
  @IsBoolean()
  HaftaIciGunuDahil: boolean;

  @IsBoolean()
  CumartesiDahil: boolean;

  @IsBoolean()
  PazarDahil: boolean;
}

export class UpdateIzinDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ItemValueDto)
  itemValue: ItemValueDto;

  @IsArray()
  @ArrayMinSize(1, { message: 'Seçili izin günü en az bir adet olmalıdır' })
  @ValidateNested({ each: true })
  @Type(() => CheckedItemDto)
  checkedItems: CheckedItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => GunlerCheckedDto)
  gunlerChecked: GunlerCheckedDto;
}
