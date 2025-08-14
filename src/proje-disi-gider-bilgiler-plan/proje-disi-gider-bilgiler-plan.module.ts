import { Module } from '@nestjs/common';
import { ProjeDisiGiderBilgilerPlanController } from './proje-disi-gider-bilgiler-plan.controller';
import { ProjeDisiGiderBilgilerPlanService } from './proje-disi-gider-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisiGiderBilgilerPlan } from './entities/proje-disi-gider-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeDisiGiderBilgilerPlan])],
  controllers: [ProjeDisiGiderBilgilerPlanController],
  providers: [ProjeDisiGiderBilgilerPlanService]
})
export class ProjeDisiGiderBilgilerPlanModule { }
