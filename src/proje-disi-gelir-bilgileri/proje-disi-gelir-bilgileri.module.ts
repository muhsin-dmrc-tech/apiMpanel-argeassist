import { Module } from '@nestjs/common';
import { ProjeDisiGelirBilgileriController } from './proje-disi-gelir-bilgileri.controller';
import { ProjeDisiGelirBilgileriService } from './proje-disi-gelir-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisiGelirBilgileri } from './entities/proje-disi-gelir-bilgileri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjeDisiGelirBilgileri])],
  controllers: [ProjeDisiGelirBilgileriController],
  providers: [ProjeDisiGelirBilgileriService]
})
export class ProjeDisiGelirBilgileriModule {}
