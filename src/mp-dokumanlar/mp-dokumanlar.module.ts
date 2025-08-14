import { Module } from '@nestjs/common';
import { MpDokumanlarController } from './mp-dokumanlar.controller';
import { MpDokumanlarService } from './mp-dokumanlar.service';
import { AppGateway } from 'src/websocket.gateway';
import { MailService } from 'src/mail/mail.service';
import { PdfAnalizService } from 'src/pdf-analiz/pdf-analiz.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MpDokumanlar } from './entities/mp-dokumanlar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MpDokumanlar]),
  ],
  controllers: [MpDokumanlarController],
  providers: [MpDokumanlarService,AppGateway,MailService,PdfAnalizService],
})
export class MpDokumanlarModule {}
