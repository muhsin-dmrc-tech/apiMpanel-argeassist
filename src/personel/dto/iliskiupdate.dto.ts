import { IsNumber, IsNotEmpty } from 'class-validator';


export class UpdateIliskiDto {
  @IsNumber({}, { message: 'Kullanıcı ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Kullanıcı ID zorunludur' })
  KullaniciID: number;

  @IsNumber({}, { message: 'Personel ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Personel ID zorunludur' })
  PersonelID: number;

  @IsNumber({}, { message: 'Iliski ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Iliski ID zorunludur' })
  IliskiID: number;

  @IsNumber({}, { message: 'Grup ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Grup ID zorunludur' })
  GrupID: number;
}
