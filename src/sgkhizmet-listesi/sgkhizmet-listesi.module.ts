import { Module } from '@nestjs/common';
import { SgkhizmetListesiController } from './sgkhizmet-listesi.controller';
import { SgkhizmetListesiService } from './sgkhizmet-listesi.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SGKHizmetDetay } from './entities/sgk-hizmet-detay.entity';
import { SGKHizmetListesi } from './entities/sgk-hizmet-listesi.entity';

@Module({
  imports:[TypeOrmModule.forFeature([SGKHizmetListesi,SGKHizmetDetay])],
  controllers: [SgkhizmetListesiController],
  providers: [SgkhizmetListesiService]
})
export class SgkhizmetListesiModule {}
