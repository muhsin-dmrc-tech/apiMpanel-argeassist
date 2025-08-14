import { Module } from '@nestjs/common';
import { SozlesmelerController } from './sozlesmeler.controller';
import { SozlesmelerService } from './sozlesmeler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sozlesmeler } from './entities/sozlesmeler.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Sozlesmeler])],
  controllers: [SozlesmelerController],
  providers: [SozlesmelerService]
})
export class SozlesmelerModule {}
