import { Module } from '@nestjs/common';
import { GrupYetkileriController } from './grup-yetkileri.controller';
import { GrupYetkileriService } from './grup-yetkileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupYetkileri } from './entities/grup-yetkileri.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GrupYetkileri])],
  controllers: [GrupYetkileriController],
  providers: [GrupYetkileriService]
})
export class GrupYetkileriModule {}
