import { Module } from '@nestjs/common';
import { DokumanlarController } from './dokumanlar.controller';
import { DokumanlarService } from './dokumanlar.service';
import { AppGateway } from 'src/websocket.gateway';
import { MailService } from 'src/mail/mail.service';
import { PdfAnalizService } from 'src/pdf-analiz/pdf-analiz.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dokumanlar } from './entities/dokumanlar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dokumanlar]),
  ],
  controllers: [DokumanlarController],
  providers: [DokumanlarService,AppGateway,MailService,PdfAnalizService],
})
export class DokumanlarModule {}
