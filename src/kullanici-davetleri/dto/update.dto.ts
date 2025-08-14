import { IsString, IsNumber, IsArray, ValidateNested, IsObject, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

class CheckedItemDto {
  @IsString({ message: i18nValidationMessage('validation.STRING', { field: 'Anahtar' }) })
  Anahtar: string;
}

class ItemValueDto {
  @IsNumber({},{ message: i18nValidationMessage('validation.NUMBER', { field: 'Kullanıcı id' }) })
  id: number;

  @IsNumber({},{ message: i18nValidationMessage('validation.NUMBER', { field: 'FirmaID' }) })
  FirmaID: number;

  @IsNumber({},{ message: i18nValidationMessage('validation.NUMBER', { field: 'KullaniciID' }) })
  KullaniciID: number;

  @IsString({ message: i18nValidationMessage('validation.STRING', { field: 'Rol' }) })
  Rol: string;
}


export class UpdateFirmaKullaniciDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ItemValueDto)
  itemValue: ItemValueDto;

  @IsArray()
  @ArrayMinSize(1, {message: i18nValidationMessage('validation.MIN_LENGTH', { field: 'Seçili Tarih' })})
  @ValidateNested({ each: true })
  @Type(() => CheckedItemDto)
  selectIzinler: CheckedItemDto[];
}
