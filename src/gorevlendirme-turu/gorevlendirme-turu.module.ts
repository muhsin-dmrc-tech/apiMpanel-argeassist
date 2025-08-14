import { Module } from '@nestjs/common';
import { GorevlendirmeTuruController } from './gorevlendirme-turu.controller';
import { GorevlendirmeTuruService } from './gorevlendirme-turu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GorevlendirmeTuru } from './entities/gorevlendirme-turu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GorevlendirmeTuru])],
  controllers: [GorevlendirmeTuruController],
  providers: [GorevlendirmeTuruService]
})
export class GorevlendirmeTuruModule {}
