import { Module } from '@nestjs/common';
import { ProjeDisiDisTicaretBilgileriController } from './proje-disi-dis-ticaret-bilgileri.controller';
import { ProjeDisiDisTicaretBilgileriService } from './proje-disi-dis-ticaret-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisiDisTicaretBilgileri } from './entities/proje-disi-dis-ticaret-bilgileri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjeDisiDisTicaretBilgileri])],
  controllers: [ProjeDisiDisTicaretBilgileriController],
  providers: [ProjeDisiDisTicaretBilgileriService]
})
export class ProjeDisiDisTicaretBilgileriModule {}
