import { Module } from '@nestjs/common';
import { ProjeGelirBilgileriController } from './proje-gelir-bilgileri.controller';
import { ProjeGelirBilgileriService } from './proje-gelir-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeGelirBilgileri } from './entities/proje-gelir-bilgileri.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeGelirBilgileri])],
  controllers: [ProjeGelirBilgileriController],
  providers: [ProjeGelirBilgileriService]
})
export class ProjeGelirBilgileriModule {}
