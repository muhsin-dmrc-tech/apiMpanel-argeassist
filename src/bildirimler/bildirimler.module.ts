import { Module } from '@nestjs/common';
import { BildirimlerController } from './bildirimler.controller';
import { BildirimlerService } from './bildirimler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bildirimler } from './entities/bildirimler.entity';
import { AppGateway } from 'src/websocket.gateway';

@Module({
  imports:[TypeOrmModule.forFeature([Bildirimler])],
  controllers: [BildirimlerController],
  providers: [BildirimlerService,AppGateway],
  exports:[BildirimlerService]
})
export class BildirimlerModule {}
