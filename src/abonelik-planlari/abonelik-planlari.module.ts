import { Module } from '@nestjs/common';
import { AbonelikPlanlariController } from './abonelik-planlari.controller';
import { AbonelikPlanlariService } from './abonelik-planlari.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbonelikPlanlari } from './entities/abonelik-planlari.entity';

@Module({
  imports:[TypeOrmModule.forFeature([AbonelikPlanlari])],
  controllers: [AbonelikPlanlariController],
  providers: [AbonelikPlanlariService]
})
export class AbonelikPlanlariModule {}
