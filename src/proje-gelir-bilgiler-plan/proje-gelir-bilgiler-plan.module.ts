import { Module } from '@nestjs/common';
import { ProjeGelirBilgilerPlanController } from './proje-gelir-bilgiler-plan.controller';
import { ProjeGelirBilgilerPlanService } from './proje-gelir-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeGelirBilgilerPlan } from './entities/proje-gelir-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeGelirBilgilerPlan])],
  controllers: [ProjeGelirBilgilerPlanController],
  providers: [ProjeGelirBilgilerPlanService]
})
export class ProjeGelirBilgilerPlanModule {}
