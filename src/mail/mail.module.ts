import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { LogsService } from 'src/logs-tables/logs.service';

@Module({
  providers: [MailService,LogsService],
  exports: [MailService],
})
export class MailModule {}
