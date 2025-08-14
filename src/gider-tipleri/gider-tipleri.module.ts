import { Module } from '@nestjs/common';
import { GiderTipleriController } from './gider-tipleri.controller';
import { GiderTipleriService } from './gider-tipleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiderTipi } from './entities/gider-tipleri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([GiderTipi])],
  controllers: [GiderTipleriController],
  providers: [GiderTipleriService]
})
export class GiderTipleriModule {}
