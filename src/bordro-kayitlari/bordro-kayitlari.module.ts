import { Module } from '@nestjs/common';
import { BordroKayitlariController } from './bordro-kayitlari.controller';
import { BordroKayitlariService } from './bordro-kayitlari.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BordroKayitlari } from './entities/bordro-kayitlari.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BordroKayitlari])],
  controllers: [BordroKayitlariController],
  providers: [BordroKayitlariService]
})
export class BordroKayitlariModule {}
