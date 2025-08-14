import { IsString, IsNumber,  IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFirmaKullaniciDto {
  @IsNumber({},{ message: 'Iliski ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Iliski ID zorunludur' })
  IliskiID: number;

  @IsString({ message: 'E-posta string türünde olmalıdır' })
  @IsNotEmpty({ message: 'E-posta zorunludur' })
  @IsEmail({}, { message: 'Geçersiz e-posta adresi' })
  email: string;

  @IsNumber({},{ message: 'Grup ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Grup ID zorunludur' })
  GrupID: number;

  @IsOptional()
  @IsNumber({},{ message: 'Personel ID numara türünde olmalıdır' })
  PersonelID: number;
}
