import { Module } from '@nestjs/common';
import { IzinSureleriService } from './izin-sureleri.service';
import { IzinSureleriController } from './izin-sureleri.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IzinSureleri } from './entities/izin-sureleri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([IzinSureleri])],
  providers: [IzinSureleriService],
  controllers: [IzinSureleriController]
})
export class IzinSureleriModule {}
