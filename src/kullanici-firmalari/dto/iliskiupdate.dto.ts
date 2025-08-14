import { IsNumber, IsNotEmpty } from 'class-validator';


export class UpdateFirmaKullaniciDto {
  @IsNumber({}, { message: 'Kullanıcı ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Kullanıcı ID zorunludur' })
  KullaniciID: number;

  @IsNumber({}, { message: 'Firma ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Firma ID zorunludur' })
  FirmaID: number;

  @IsNumber({}, { message: 'Grup ID numara türünde olmalıdır' })
  @IsNotEmpty({ message: 'Grup ID zorunludur' })
  GrupID: number;
}
