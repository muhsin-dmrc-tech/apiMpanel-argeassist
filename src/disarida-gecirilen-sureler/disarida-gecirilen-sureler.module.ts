import { Module } from '@nestjs/common';
import { DisaridaGecirilenSurelerController } from './disarida-gecirilen-sureler.controller';
import { DisaridaGecirilenSurelerService } from './disarida-gecirilen-sureler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisaridaGecirilenSureler } from './entities/disarida-gecirilen-sureler.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DisaridaGecirilenSureler])],
  controllers: [DisaridaGecirilenSurelerController],
  providers: [DisaridaGecirilenSurelerService]
})
export class DisaridaGecirilenSurelerModule {}
