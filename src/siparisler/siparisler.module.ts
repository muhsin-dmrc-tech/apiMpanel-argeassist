import { Module } from '@nestjs/common';
import { SiparislerController } from './siparisler.controller';
import { SiparislerService } from './siparisler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Siparisler } from './entities/siparisler.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Siparisler])],
  controllers: [SiparislerController],
  providers: [SiparislerService]
})
export class SiparislerModule {}
