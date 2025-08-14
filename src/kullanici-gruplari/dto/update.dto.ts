import { IsString, IsNumber, IsArray, ValidateNested, IsObject, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class CheckedItemDto {
  @IsString({ message: 'Anahtar string olmalıdır' })
  Anahtar: string;
}

class ItemValueDto {
  @IsNotEmpty({ message: 'Grup ID zorunludur' })
  @IsNumber({}, { message: 'Grup ID number türünde olmalıdır' })
  GrupID: number;

  @IsNotEmpty({ message: 'İlişki ID zorunludur' })
  @IsNumber({}, { message: 'İlişki ID number türünde olmalıdır' })
  IliskiID: number;

  @IsNotEmpty({ message: 'Grup Adı zorunludur' })
  @IsString({ message: 'Grup Adı string olmalıdır' })
  GrupAdi: string;
}


export class UpdateGrupKullaniciDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ItemValueDto)
  itemValue: ItemValueDto;

  @IsArray()
  @ArrayMinSize(1, { message: 'Seçili izinler minimum 1 adet olmalıdır' })
  @ValidateNested({ each: true })
  @Type(() => CheckedItemDto)
  selectIzinler: CheckedItemDto[];
}
