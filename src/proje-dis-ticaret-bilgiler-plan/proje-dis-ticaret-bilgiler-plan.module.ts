import { Module } from '@nestjs/common';
import { ProjeDisTicaretBilgilerPlanController } from './proje-dis-ticaret-bilgiler-plan.controller';
import { ProjeDisTicaretBilgilerPlanService } from './proje-dis-ticaret-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisTicaretBilgilerPlan } from './entities/proje-dis-ticaret-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeDisTicaretBilgilerPlan])],
  controllers: [ProjeDisTicaretBilgilerPlanController],
  providers: [ProjeDisTicaretBilgilerPlanService]
})
export class ProjeDisTicaretBilgilerPlanModule {}
