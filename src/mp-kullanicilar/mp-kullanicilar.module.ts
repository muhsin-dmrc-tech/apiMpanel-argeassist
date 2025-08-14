import { Module } from '@nestjs/common';
import { MpKullanicilarController } from './mp-kullanicilar.controller';
import { MpKullanicilarService } from './mp-kullanicilar.service';

@Module({
  controllers: [MpKullanicilarController],
  providers: [MpKullanicilarService]
})
export class MpKullanicilarModule {}
