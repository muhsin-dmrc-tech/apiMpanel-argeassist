import { Module } from '@nestjs/common';
import { RotaIzinleriController } from './rota-izinleri.controller';
import { RotaIzinleriService } from './rota-izinleri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RotaIzinleri } from './entities/rota-izinleri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([RotaIzinleri])],
  controllers: [RotaIzinleriController],
  providers: [RotaIzinleriService]
})
export class RotaIzinleriModule {}
