import { Module } from '@nestjs/common';
import { KullaniciGruplariController } from './kullanici-gruplari.controller';
import { KullaniciGruplariService } from './kullanici-gruplari.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KullaniciGruplari } from './entities/kullanici-gruplari.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KullaniciGruplari])],
  controllers: [KullaniciGruplariController],
  providers: [KullaniciGruplariService]
})
export class KullaniciGruplariModule {}
