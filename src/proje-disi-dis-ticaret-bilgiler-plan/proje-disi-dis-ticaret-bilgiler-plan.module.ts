import { Module } from '@nestjs/common';
import { ProjeDisiDisTicaretBilgilerPlanController } from './proje-disi-dis-ticaret-bilgiler-plan.controller';
import { ProjeDisiDisTicaretBilgilerPlanService } from './proje-disi-dis-ticaret-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisiDisTicaretBilgilerPlan } from './entities/proje-disi-dis-ticaret-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeDisiDisTicaretBilgilerPlan])],
  controllers: [ProjeDisiDisTicaretBilgilerPlanController],
  providers: [ProjeDisiDisTicaretBilgilerPlanService]
})
export class ProjeDisiDisTicaretBilgilerPlanModule { }
