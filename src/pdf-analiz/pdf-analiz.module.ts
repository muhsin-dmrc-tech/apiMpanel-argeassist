import { Module } from '@nestjs/common';
import { PdfAnalizController } from './pdf-analiz.controller';
import { PdfAnalizService } from './pdf-analiz.service';

@Module({
  controllers: [PdfAnalizController],
  providers: [PdfAnalizService],
  exports:[PdfAnalizService]
})
export class PdfAnalizModule {}
