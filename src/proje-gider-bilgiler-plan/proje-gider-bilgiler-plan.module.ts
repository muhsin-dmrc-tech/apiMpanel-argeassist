import { Module } from '@nestjs/common';
import { ProjeGiderBilgilerPlanController } from './proje-gider-bilgiler-plan.controller';
import { ProjeGiderBilgilerPlanService } from './proje-gider-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeGiderBilgilerPlan } from './entities/proje-gider-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeGiderBilgilerPlan])],
  controllers: [ProjeGiderBilgilerPlanController],
  providers: [ProjeGiderBilgilerPlanService]
})
export class ProjeGiderBilgilerPlanModule {}
