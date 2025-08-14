import { Module } from '@nestjs/common';
import { DestekTipleriController } from './destek-tipleri.controller';
import { DestekTipleriService } from './destek-tipleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestekTipi } from './entities/destek-tipleri.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DestekTipi])],
  controllers: [DestekTipleriController],
  providers: [DestekTipleriService]
})
export class DestekTipleriModule {}
