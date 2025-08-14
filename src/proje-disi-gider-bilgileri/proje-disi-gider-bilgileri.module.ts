import { Module } from '@nestjs/common';
import { ProjeDisiGiderBilgileriController } from './proje-disi-gider-bilgileri.controller';
import { ProjeDisiGiderBilgileriService } from './proje-disi-gider-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisiGiderBilgileri } from './entities/proje-disi-gider-bilgileri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjeDisiGiderBilgileri])],
  controllers: [ProjeDisiGiderBilgileriController],
  providers: [ProjeDisiGiderBilgileriService]
})
export class ProjeDisiGiderBilgileriModule {}
