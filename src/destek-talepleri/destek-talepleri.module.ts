import { Module } from '@nestjs/common';
import { DestekTalepleriController } from './destek-talepleri.controller';
import { DestekTalepleriService } from './destek-talepleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestekTalepleri } from './entities/destek-talepleri.entity';
import { DestekTalepMesajlari } from './entities/destek-talep-mesajlari.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DestekTalepleri,DestekTalepMesajlari])],
  controllers: [DestekTalepleriController],
  providers: [DestekTalepleriService]
})
export class DestekTalepleriModule {}
