import { Module } from '@nestjs/common';
import { ProjeRaporlariController } from './proje-raporlari.controller';
import { ProjeRaporlariService } from './proje-raporlari.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeRaporlari } from './entities/proje-raporlari.entity';
import { PersonelService } from 'src/personel/personel.service';
import { Personel } from 'src/personel/entities/personel.entity';
import { PersonelModule } from 'src/personel/personel.module';
import { AppGateway } from 'src/websocket.gateway';
import { MailService } from 'src/mail/mail.service';
import { PdfAnalizService } from 'src/pdf-analiz/pdf-analiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjeRaporlari, Personel]),
    PersonelModule
  ],
  controllers: [ProjeRaporlariController],
  providers: [ProjeRaporlariService,AppGateway,MailService,PdfAnalizService],
  exports: [ProjeRaporlariService]
})
export class ProjeRaporlariModule {}
