import { Module } from '@nestjs/common';
import { PdksplanController } from './pdksplan.controller';
import { PdksplanService } from './pdksplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDKSPlan } from './entities/pdks-plan.entity';

@Module({
  imports:[TypeOrmModule.forFeature([PDKSPlan])],
  controllers: [PdksplanController],
  providers: [PdksplanService]
})
export class PdksplanModule {}
