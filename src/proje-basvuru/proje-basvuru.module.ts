import { Module } from '@nestjs/common';
import { ProjeBasvuruController } from './proje-basvuru.controller';
import { ProjeBasvuruService } from './proje-basvuru.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeBasvuru } from './entities/proje.basvuru.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjeBasvuru])],
  controllers: [ProjeBasvuruController],
  providers: [ProjeBasvuruService]
})
export class ProjeBasvuruModule {}
