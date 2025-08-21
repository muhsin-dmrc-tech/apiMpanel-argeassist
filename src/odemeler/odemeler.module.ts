import { Module } from '@nestjs/common';
import { OdemelerController } from './odemeler.controller';
import { OdemelerService } from './odemeler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Odemeler } from './entities/odemeler.entity';
import { FaturaBilgileriModule } from 'src/fatura-bilgileri/fatura-bilgileri.module';
import { FaturalarModule } from 'src/faturalar/faturalar.module';
import { FirmaAbonelikleriModule } from 'src/firma-abonelikleri/firma-abonelikleri.module';
import { AppGateway } from 'src/websocket.gateway';

@Module({
  imports:[TypeOrmModule.forFeature([Odemeler]),
  FaturaBilgileriModule,
  FaturalarModule,
  FirmaAbonelikleriModule
],
  controllers: [OdemelerController],
  providers: [OdemelerService,AppGateway],
})
export class OdemelerModule {}
