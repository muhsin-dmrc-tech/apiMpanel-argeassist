import { Module } from '@nestjs/common';
import { SohbetlerController } from './sohbetler.controller';
import { SohbetlerService } from './sohbetler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sohbetler } from './entities/sohbetler.entity';
import { SohbetMesajlari } from './entities/sohbet-mesajlari.entity';
import { SohbetKullanicilari } from './entities/sohbet-kullanicilari.entity';
import { AppGateway } from 'src/websocket.gateway';
import { BildirimlerService } from 'src/bildirimler/bildirimler.service';
import { BildirimlerModule } from 'src/bildirimler/bildirimler.module';

@Module({
  imports:[TypeOrmModule.forFeature([Sohbetler,SohbetMesajlari,SohbetKullanicilari]),BildirimlerModule],
  controllers: [SohbetlerController],
  providers: [SohbetlerService,AppGateway]
})
export class SohbetlerModule {}
