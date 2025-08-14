import { Module } from '@nestjs/common';
import { MpAuthController } from './mp-auth.controller';
import { MpAuthService } from './mp-auth.service';
import { MpKullanicilarModule } from 'src/mp-kullanicilar/mp-kullanicilar.module';
import { MpLoginKayitlariModule } from 'src/mp-login-kayitlari/mp-login-kayitlari.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from 'src/mail/mail.module';
import { SmsModule } from 'src/sms/sms.module';
import { SmsService } from 'src/sms/sms.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { MpKullanicilarService } from 'src/mp-kullanicilar/mp-kullanicilar.service';
import { LogsService } from 'src/logs-tables/logs.service';

@Module({
  imports: [
    MpKullanicilarModule,
    MpLoginKayitlariModule,
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
  controllers: [MpAuthController],
  providers: [MpAuthService, JwtStrategy, MpKullanicilarService, SmsService, LogsService],
  exports: [MpAuthService, JwtStrategy, MpKullanicilarService],
})
export class MpAuthModule { }
