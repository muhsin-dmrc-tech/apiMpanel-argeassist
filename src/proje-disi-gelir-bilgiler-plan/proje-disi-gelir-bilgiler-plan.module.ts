import { Module } from '@nestjs/common';
import { ProjeDisiGelirBilgilerPlanController } from './proje-disi-gelir-bilgiler-plan.controller';
import { ProjeDisiGelirBilgilerPlanService } from './proje-disi-gelir-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisiGelirBilgilerPlan } from './entities/proje-disi-gelir-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeDisiGelirBilgilerPlan])],
  controllers: [ProjeDisiGelirBilgilerPlanController],
  providers: [ProjeDisiGelirBilgilerPlanService]
})
export class ProjeDisiGelirBilgilerPlanModule {}
