import { Module } from '@nestjs/common';
import { PdksController } from './pdks.controller';
import { PdksService } from './pdks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDKS } from './entities/pdks.entity';

@Module({
  imports:[TypeOrmModule.forFeature([PDKS])],
  controllers: [PdksController],
  providers: [PdksService]
})
export class PdksModule {}
