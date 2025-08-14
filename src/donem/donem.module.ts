import { Module } from '@nestjs/common';
import { DonemController } from './donem.controller';
import { DonemService } from './donem.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donem } from './entities/donem.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Donem])],
  controllers: [DonemController],
  providers: [DonemService]
})
export class DonemModule {}
