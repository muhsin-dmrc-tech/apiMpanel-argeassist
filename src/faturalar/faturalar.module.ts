import { Module } from '@nestjs/common';
import { FaturalarController } from './faturalar.controller';
import { FaturalarService } from './faturalar.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faturalar } from './entities/faturalar.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Faturalar])],
  controllers: [FaturalarController],
  providers: [FaturalarService],
  exports: [FaturalarService]
})
export class FaturalarModule {}
