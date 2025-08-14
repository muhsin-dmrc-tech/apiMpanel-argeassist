import { Module } from '@nestjs/common';
import { ProjeIlerlemeBilgilerController } from './proje-ilerleme-bilgiler.controller';
import { ProjeIlerlemeBilgilerService } from './proje-ilerleme-bilgiler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeIlerlemeBilgiler } from './entities/proje-ilerleme-bilgiler.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjeIlerlemeBilgiler])],
  controllers: [ProjeIlerlemeBilgilerController],
  providers: [ProjeIlerlemeBilgilerService]
})
export class ProjeIlerlemeBilgilerModule {}
