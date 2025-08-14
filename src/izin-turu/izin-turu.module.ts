import { Module } from '@nestjs/common';
import { IzinTuruService } from './izin-turu.service';
import { IzinTuruController } from './izin-turu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IzinTuru } from './entities/izin-turu.entity';

@Module({
  imports:[TypeOrmModule.forFeature([IzinTuru])],
  providers: [IzinTuruService],
  controllers: [IzinTuruController]
})
export class IzinTuruModule {}
