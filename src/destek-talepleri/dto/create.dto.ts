import { IsString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class CreateDestekTalepDto {
  @ValidateIf((o) => o.DestekTalepID === undefined)
  @IsNotEmpty({ message: 'DestekTipiID zorunludur' })
  @IsString()
  DestekTipiID: string;

  @IsOptional()
  @IsString()
  DestekTalepID: string;


  @ValidateIf((o) => o.DestekTalepID === undefined)
  @ValidateIf((o) => o.Departman === 'Teknokent')
  @IsNotEmpty({ message: 'Teknokent departmanı için ProjeID zorunludur' })
  @IsString()
  ProjeID?: string;


  @ValidateIf((o) => o.DestekTalepID === undefined)
  @IsNotEmpty({ message: 'Başlık zorunludur' })
  @IsString()
  Baslik: string;

  @IsNotEmpty({ message: 'Mesaj zorunludur' })
  @IsString()
  Mesaj: string;

  @ValidateIf((o) => o.DestekTalepID === undefined)
  @IsNotEmpty({ message: 'Departman zorunludur' })
  @IsString()
  Departman: string;

  @IsNotEmpty({ message: 'KullaniciTipi zorunludur' })
  @IsString()
  KullaniciTipi: string;

 
  @IsOptional()
  @IsString()
  KonuyuKapat: string;
}