import { Module } from '@nestjs/common';
import { FaturaBilgileriController } from './fatura-bilgileri.controller';
import { FaturaBilgileriService } from './fatura-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaturaBilgileri } from './entities/fatura-bilgileri.entity';

@Module({
  imports:[TypeOrmModule.forFeature([FaturaBilgileri])],
  controllers: [FaturaBilgileriController],
  providers: [FaturaBilgileriService],
  exports: [FaturaBilgileriService]
})
export class FaturaBilgileriModule {}
