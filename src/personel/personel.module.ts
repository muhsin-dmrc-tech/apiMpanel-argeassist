import { Module } from '@nestjs/common';
import { PersonelService } from './personel.service';
import { PersonelController } from './personel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personel } from './entities/personel.entity';

@Module({
    imports:[TypeOrmModule.forFeature([Personel])],
    controllers: [PersonelController],
    providers: [PersonelService],
    exports: [PersonelService, TypeOrmModule],
})
export class PersonelModule {}
