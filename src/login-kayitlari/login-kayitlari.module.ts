import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginKayitlari } from './entities/login-kayitlari.entity';

@Module({
  imports:[TypeOrmModule.forFeature([LoginKayitlari])],
  controllers: [],
  providers: [],
})
export class LoginKayitlariModule {}
