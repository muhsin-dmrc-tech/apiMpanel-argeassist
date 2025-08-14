import { Module } from '@nestjs/common';
import { ProjelerController } from './projeler.controller';
import { ProjelerService } from './projeler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projeler } from './entities/projeler.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Projeler])],
  controllers: [ProjelerController],
  providers: [ProjelerService]
})
export class ProjelerModule {}
