import { Module } from '@nestjs/common';
import { FirmaMuafiyetBilgilerController } from './firma-muafiyet-bilgiler.controller';
import { FirmaMuafiyetBilgilerService } from './firma-muafiyet-bilgiler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmaMuafiyetBilgiler } from './entities/firma-muafiyet-bilgiler.entity';

@Module({
  imports:[TypeOrmModule.forFeature([FirmaMuafiyetBilgiler])],
  controllers: [FirmaMuafiyetBilgilerController],
  providers: [FirmaMuafiyetBilgilerService]
})
export class FirmaMuafiyetBilgilerModule {}
