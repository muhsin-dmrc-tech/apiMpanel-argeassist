import { Module } from '@nestjs/common';
import { FirmalarController } from './firmalar.controller';
import { FirmalarService } from './firmalar.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Firma } from './entities/firma.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Firma])],
  controllers: [FirmalarController],
  providers: [FirmalarService]
})
export class FirmalarModule {}
