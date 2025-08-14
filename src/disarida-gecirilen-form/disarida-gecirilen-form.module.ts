import { Module } from '@nestjs/common';
import { DisaridaGecirilenFormController } from './disarida-gecirilen-form.controller';
import { DisaridaGecirilenFormService } from './disarida-gecirilen-form.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisaridaGecirilenForm } from './entities/disarida-gecirilen-form.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DisaridaGecirilenForm])],
  controllers: [DisaridaGecirilenFormController],
  providers: [DisaridaGecirilenFormService]
})
export class DisaridaGecirilenFormModule {}
