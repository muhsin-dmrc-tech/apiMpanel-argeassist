import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginKayitlariModule } from './login-kayitlari/login-kayitlari.module';
import { KullanicilarService } from './kullanicilar/kullanicilar.service';
import { KullanicilarController } from './kullanicilar/kullanicilar.controller';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppGateway } from './websocket.gateway';
import { LogsModule } from './logs-tables/logs.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { LogsService } from './logs-tables/logs.service';
import { JwtService } from '@nestjs/jwt';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { KullanicilarModule } from './kullanicilar/kullanicilar.module';
import { DonemModule } from './donem/donem.module';
import { IzinTuruModule } from './izin-turu/izin-turu.module';
import { ProjelerModule } from './projeler/projeler.module';
import { RotaIzinleriModule } from './rota-izinleri/rota-izinleri.module';
import { ResmitatillerModule } from './resmitatiller/resmitatiller.module';
import { CalismaTuruModule } from './calisma-turu/calisma-turu.module';
import { GorevlendirmeTuruModule } from './gorevlendirme-turu/gorevlendirme-turu.module';
import { MuafiyetTipleriModule } from './muafiyet-tipleri/muafiyet-tipleri.module';
import { BildirimlerModule } from './bildirimler/bildirimler.module';
import { KullaniciBildirimleriModule } from './kullanici-bildirimleri/kullanici-bildirimleri.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GiderTipleriModule } from './gider-tipleri/gider-tipleri.module';
import { SozlesmelerModule } from './sozlesmeler/sozlesmeler.module';
import { ProjeBasvuruModule } from './proje-basvuru/proje-basvuru.module';
import { getConfig } from '../db/data-source.config';
import { SureclerModule } from './surecler/surecler.module';
import { PdfAnalizModule } from './pdf-analiz/pdf-analiz.module';
import { DokumanlarModule } from './dokumanlar/dokumanlar.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => (getConfig())
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 40,
      },
    ]),
    //FirebaseAdminModule,
    KullanicilarModule,
    AuthModule,
    LoginKayitlariModule,
    LogsModule,
    //FirmalarModule,
    DonemModule,
    //PersonelModule,
    IzinTuruModule,
    //IzinTalepleriModule,
   // IzinSureleriModule,
    ProjelerModule,
    RotaIzinleriModule,
    MailModule,
    EmailTemplatesModule,
    //PdksModule,
    ResmitatillerModule,
   // DisaridaGecirilenSurelerModule,
    //DisaridaGecirilenFormModule,
    CalismaTuruModule,
    GorevlendirmeTuruModule,
   //KullaniciDavetleriModule,
   // ProjeIlerlemeBilgilerModule,
   // FirmaMuafiyetBilgilerModule,
    MuafiyetTipleriModule,
    //ProjeGelirBilgileriModule,
    BildirimlerModule,
    KullaniciBildirimleriModule,
    //FirmaAbonelikleriModule,
    //AbonelikPlanlariModule,
   // FaturalarModule,
    //OdemelerModule,
    //FaturaBilgileriModule,
   // ProjeGiderBilgileriModule,
    GiderTipleriModule,
   // ProjeDisiGiderBilgileriModule,
    //ProjeDisiGelirBilgileriModule,
    //SiparislerModule,
    SozlesmelerModule,
   // ProjeDisiDisTicaretBilgileriModule,
    //SgkhizmetListesiModule,
    //TeknokentlerModule,
    ProjeBasvuruModule,
    //GorevListesiModule,
    //ProjeDisTicaretBilgileriModule,
   // KullaniciGruplariModule,
    //GrupYetkileriModule,
    //BordroKayitlariModule,
    //DestekTipleriModule,
    //DestekTalepleriModule,
    //ProjeRaporlariModule,
    //SohbetlerModule,
    SureclerModule,
    PdfAnalizModule,
    DokumanlarModule,
  ],
  controllers: [
    AppController,
    KullanicilarController,
    //PersonelController
  ],
  providers: [
    AppService,
    KullanicilarService,
    //PersonelService,
    AppGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    LogsService,
    JwtService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    MailService

  ],
})
export class AppModule { }
