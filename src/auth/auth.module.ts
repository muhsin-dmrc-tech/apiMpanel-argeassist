import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KullanicilarModule } from '../kullanicilar/kullanicilar.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { KullanicilarService } from 'src/kullanicilar/kullanicilar.service';
import { LoginKayitlariModule } from 'src/login-kayitlari/login-kayitlari.module';
import { MailModule } from 'src/mail/mail.module';
import { SmsModule } from 'src/sms/sms.module';
import { SmsService } from 'src/sms/sms.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogsService } from 'src/logs-tables/logs.service';
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    KullanicilarModule,
    LoginKayitlariModule,
    PassportModule,
    MailModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    SmsModule,
    HttpModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, KullanicilarService, SmsService,LogsService],
  exports: [AuthService, JwtStrategy, KullanicilarService],
})
export class AuthModule {}
