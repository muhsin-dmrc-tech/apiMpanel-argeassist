import { Module } from '@nestjs/common';
import { CalismaTuruController } from './calisma-turu.controller';
import { CalismaTuruService } from './calisma-turu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalismaTuru } from './entities/calisma-turu.entity';

@Module({
  imports:[TypeOrmModule.forFeature([CalismaTuru])],
  controllers: [CalismaTuruController],
  providers: [CalismaTuruService]
})
export class CalismaTuruModule {}
