import { Module } from '@nestjs/common';
import { IzinTalepleriController } from './izin-talepleri.controller';
import { IzinTalepleriService } from './izin-talepleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IzinTalepleri } from './entities/izin-talepleri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([IzinTalepleri])],
  controllers: [IzinTalepleriController],
  providers: [IzinTalepleriService]
})
export class IzinTalepleriModule {}
