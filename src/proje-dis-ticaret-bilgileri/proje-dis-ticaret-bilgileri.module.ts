import { Module } from '@nestjs/common';
import { ProjeDisTicaretBilgileriController } from './proje-dis-ticaret-bilgileri.controller';
import { ProjeDisTicaretBilgileriService } from './proje-dis-ticaret-bilgileri.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjeDisTicaretBilgileri } from './entities/proje-dis-ticaret-bilgileri.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjeDisTicaretBilgileri])],
  controllers: [ProjeDisTicaretBilgileriController],
  providers: [ProjeDisTicaretBilgileriService]
})
export class ProjeDisTicaretBilgileriModule {}
