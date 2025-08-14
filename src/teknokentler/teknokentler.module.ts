import { Module } from '@nestjs/common';
import { TeknokentlerController } from './teknokentler.controller';
import { TeknokentlerService } from './teknokentler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teknokentler } from './entities/teknokentler.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Teknokentler])],
  controllers: [TeknokentlerController],
  providers: [TeknokentlerService]
})
export class TeknokentlerModule {}
