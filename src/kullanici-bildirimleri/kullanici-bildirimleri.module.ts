import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KullaniciBildirimleri } from './entities/kullanici-bildirimleri.entity';
import { KullaniciBildirimleriController } from './kullanici-bildirimleri.controller';
import { KullaniciBildirimleriService } from './kullanici-bildirimleri.service';
import { AppGateway } from 'src/websocket.gateway';

@Module({imports:[
    TypeOrmModule.forFeature([KullaniciBildirimleri])
], 
controllers: [KullaniciBildirimleriController], 
providers: [KullaniciBildirimleriService,AppGateway]})
export class KullaniciBildirimleriModule {}
