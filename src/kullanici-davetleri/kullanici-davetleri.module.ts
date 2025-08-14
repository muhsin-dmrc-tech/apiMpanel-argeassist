import { Module } from '@nestjs/common';
import { KullaniciDavetleriController } from './kullanici-davetleri.controller';
import { KullaniciDavetleriService } from './kullanici-davetleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KullaniciDavetleri } from './entities/kullanici-davetleri.entity';
import { MailModule } from 'src/mail/mail.module';
import { AppGateway } from 'src/websocket.gateway';

@Module({
  imports:[TypeOrmModule.forFeature([KullaniciDavetleri]),
      MailModule],
  controllers: [KullaniciDavetleriController],
  providers: [KullaniciDavetleriService,AppGateway]
})
export class KullaniciDavetleriModule {}
