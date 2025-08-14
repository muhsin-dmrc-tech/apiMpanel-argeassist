import { Module } from '@nestjs/common';
import { ResmitatillerController } from './resmitatiller.controller';
import { ResmitatillerService } from './resmitatiller.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResmiTatiller } from './entities/resmitatiller.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ResmiTatiller])],
  controllers: [ResmitatillerController],
  providers: [ResmitatillerService]
})
export class ResmitatillerModule {}
