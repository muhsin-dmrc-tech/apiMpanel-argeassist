import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kullanicilar } from './entities/kullanicilar.entity';
import { KullanicilarService } from './kullanicilar.service';
import { KullanicilarController } from './kullanicilar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Kullanicilar])], // Kullanicilar repository'yi sağlar
  controllers: [KullanicilarController],
  providers: [KullanicilarService],
  exports: [KullanicilarService, TypeOrmModule], // Diğer modüllerde kullanılabilmesi için export et
})
export class KullanicilarModule {}
  