import { Module } from '@nestjs/common';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplates } from './entities/email.templates.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[TypeOrmModule.forFeature([EmailTemplates]),JwtModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService]
})
export class EmailTemplatesModule {}
