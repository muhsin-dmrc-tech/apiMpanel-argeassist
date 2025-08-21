import { Module } from '@nestjs/common';
import { BordroHesaplamaController } from './bordro-hesaplama.controller';
import { BordroHesaplamaService } from './bordro-hesaplama.service';

@Module({
  controllers: [BordroHesaplamaController],
  providers: [BordroHesaplamaService]
})
export class BordroHesaplamaModule {}
