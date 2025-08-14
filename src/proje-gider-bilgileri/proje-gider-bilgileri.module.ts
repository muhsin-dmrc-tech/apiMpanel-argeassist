import { Module } from '@nestjs/common';
import { ProjeGiderBilgileriController } from './proje-gider-bilgileri.controller';
import { ProjeGiderBilgileriService } from './proje-gider-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeGiderBilgileri } from './entities/proje-gider-bilgileri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjeGiderBilgileri])],
  controllers: [ProjeGiderBilgileriController],
  providers: [ProjeGiderBilgileriService]
})
export class ProjeGiderBilgileriModule {}
