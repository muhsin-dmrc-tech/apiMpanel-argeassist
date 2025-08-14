import { Module } from '@nestjs/common';
import { MuafiyetTipleriController } from './muafiyet-tipleri.controller';
import { MuafiyetTipleriService } from './muafiyet-tipleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuafiyetTipi } from './entities/muafiyet-tipleri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([MuafiyetTipi])],
  controllers: [MuafiyetTipleriController],
  providers: [MuafiyetTipleriService]
})
export class MuafiyetTipleriModule {}
