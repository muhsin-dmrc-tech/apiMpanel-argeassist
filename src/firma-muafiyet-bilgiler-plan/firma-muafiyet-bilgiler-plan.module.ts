import { Module } from '@nestjs/common';
import { FirmaMuafiyetBilgilerPlanController } from './firma-muafiyet-bilgiler-plan.controller';
import { FirmaMuafiyetBilgilerPlanService } from './firma-muafiyet-bilgiler-plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmaMuafiyetBilgilerPlan } from './entities/firma-muafiyet-bilgiler-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FirmaMuafiyetBilgilerPlan])],
  controllers: [FirmaMuafiyetBilgilerPlanController],
  providers: [FirmaMuafiyetBilgilerPlanService]
})
export class FirmaMuafiyetBilgilerPlanModule {}
