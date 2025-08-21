import { Module } from '@nestjs/common';
import { FirmaAbonelikleriController } from './firma-abonelikleri.controller';
import { FirmaAbonelikleriService } from './firma-abonelikleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmaAbonelikleri } from './entities/firma-abonelikleri.entity';
import { AppGateway } from 'src/websocket.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([FirmaAbonelikleri])],
  controllers: [FirmaAbonelikleriController],
  providers: [FirmaAbonelikleriService,AppGateway],
  exports: [FirmaAbonelikleriService]
})
export class FirmaAbonelikleriModule {}
