import { Module } from '@nestjs/common';
import { KullaniciFirmalariController } from './kullanici-firmalari.controller';
import { KullaniciFirmalariService } from './kullanici-firmalari.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KullaniciFirmalari } from './entities/kullanici-firmalari.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KullaniciFirmalari])],
  controllers: [KullaniciFirmalariController],
  providers: [KullaniciFirmalariService]
})
export class KullaniciFirmalariModule {}
