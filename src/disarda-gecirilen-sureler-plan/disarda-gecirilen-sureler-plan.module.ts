import { Module } from '@nestjs/common';
import { DisardaGecirilenSurelerPlanController } from './disarda-gecirilen-sureler-plan.controller';
import { DisardaGecirilenSurelerPlanService } from './disarda-gecirilen-sureler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisardaGecirilenSurelerPlan } from './entities/disarda-gecirilen-sureler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisardaGecirilenSurelerPlan])],
  controllers: [DisardaGecirilenSurelerPlanController],
  providers: [DisardaGecirilenSurelerPlanService]
})
export class DisardaGecirilenSurelerPlanModule {}
