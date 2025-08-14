import { Module } from '@nestjs/common';
import { ProjeIlerlemeBilgilerPlanController } from './proje-ilerleme-bilgiler-plan.controller';
import { ProjeIlerlemeBilgilerPlanService } from './proje-ilerleme-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeIlerlemeBilgilerPlan } from './entities/proje-ilerleme-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeIlerlemeBilgilerPlan])],
  controllers: [ProjeIlerlemeBilgilerPlanController],
  providers: [ProjeIlerlemeBilgilerPlanService]
})
export class ProjeIlerlemeBilgilerPlanModule {}
