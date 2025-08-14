import { Module } from '@nestjs/common';
import { GorevListesiController } from './gorev-listesi.controller';
import { GorevListesiService } from './gorev-listesi.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GorevListesi } from './entities/gorev.listesi.entity';
import { GorevKullanicilari } from './entities/gorev-kullanicilari.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GorevListesi,GorevKullanicilari])],
  controllers: [GorevListesiController],
  providers: [GorevListesiService]
})
export class GorevListesiModule {}
