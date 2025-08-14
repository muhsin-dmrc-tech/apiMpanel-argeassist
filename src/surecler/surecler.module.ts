import { Module } from '@nestjs/common';
import { SureclerController } from './surecler.controller';
import { SureclerService } from './surecler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Surecler } from './entities/surecler.entity';
import { SurecAdimlari } from './entities/surec-adimlari.entity';
import { SurecAdimBaglantilari } from './entities/surec-adim-baglantilari.entity';
import { SurecKayitlari } from './entities/surec-kayitlari.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Surecler,SurecAdimlari,SurecAdimBaglantilari,SurecKayitlari])],
  controllers: [SureclerController],
  providers: [SureclerService]
})
export class SureclerModule {}
