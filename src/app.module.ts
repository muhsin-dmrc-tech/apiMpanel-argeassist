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
import { FirmalarModule } from './firmalar/firmalar.module';
import { PersonelService } from './personel/personel.service';
import { PersonelController } from './personel/personel.controller';
import { PersonelModule } from './personel/personel.module';
import { DonemModule } from './donem/donem.module';
import { IzinTuruModule } from './izin-turu/izin-turu.module';
import { IzinTalepleriModule } from './izin-talepleri/izin-talepleri.module';
import { IzinSureleriModule } from './izin-sureleri/izin-sureleri.module';
import { ProjelerModule } from './projeler/projeler.module';
import { RotaIzinleriModule } from './rota-izinleri/rota-izinleri.module';
import { PdksModule } from './pdks/pdks.module';
import { ResmitatillerModule } from './resmitatiller/resmitatiller.module';
import { DisaridaGecirilenSurelerModule } from './disarida-gecirilen-sureler/disarida-gecirilen-sureler.module';
import { DisaridaGecirilenFormModule } from './disarida-gecirilen-form/disarida-gecirilen-form.module';
import { CalismaTuruModule } from './calisma-turu/calisma-turu.module';
import { GorevlendirmeTuruModule } from './gorevlendirme-turu/gorevlendirme-turu.module';
import { KullaniciDavetleriModule } from './kullanici-davetleri/kullanici-davetleri.module';
import { ProjeIlerlemeBilgilerModule } from './proje-ilerleme-bilgiler/proje-ilerleme-bilgiler.module';
import { FirmaMuafiyetBilgilerModule } from './firma-muafiyet-bilgiler/firma-muafiyet-bilgiler.module';
import { MuafiyetTipleriModule } from './muafiyet-tipleri/muafiyet-tipleri.module';
import { ProjeGelirBilgileriModule } from './proje-gelir-bilgileri/proje-gelir-bilgileri.module';
import { BildirimlerModule } from './bildirimler/bildirimler.module';
import { KullaniciBildirimleriModule } from './kullanici-bildirimleri/kullanici-bildirimleri.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FirmaAbonelikleriModule } from './firma-abonelikleri/firma-abonelikleri.module';
import { AbonelikPlanlariModule } from './abonelik-planlari/abonelik-planlari.module';
import { FaturalarModule } from './faturalar/faturalar.module';
import { OdemelerModule } from './odemeler/odemeler.module';
import { FaturaBilgileriModule } from './fatura-bilgileri/fatura-bilgileri.module';
import { ProjeGiderBilgileriModule } from './proje-gider-bilgileri/proje-gider-bilgileri.module';
import { GiderTipleriModule } from './gider-tipleri/gider-tipleri.module';
import { ProjeDisiGiderBilgileriModule } from './proje-disi-gider-bilgileri/proje-disi-gider-bilgileri.module';
import { ProjeDisiGelirBilgileriModule } from './proje-disi-gelir-bilgileri/proje-disi-gelir-bilgileri.module';
import { SiparislerModule } from './siparisler/siparisler.module';
import { SozlesmelerModule } from './sozlesmeler/sozlesmeler.module';
import { ProjeDisiDisTicaretBilgileriModule } from './proje-disi-dis-ticaret-bilgileri/proje-disi-dis-ticaret-bilgileri.module';
import { PdksplanModule } from './pdksplan/pdksplan.module';
import { SgkhizmetListesiModule } from './sgkhizmet-listesi/sgkhizmet-listesi.module';
import { TeknokentlerModule } from './teknokentler/teknokentler.module';
import { ProjeBasvuruModule } from './proje-basvuru/proje-basvuru.module';
import { GorevListesiModule } from './gorev-listesi/gorev-listesi.module';
import { ProjeDisTicaretBilgileriModule } from './proje-dis-ticaret-bilgileri/proje-dis-ticaret-bilgileri.module';
import { KullaniciGruplariModule } from './kullanici-gruplari/kullanici-gruplari.module';
import { GrupYetkileriModule } from './grup-yetkileri/grup-yetkileri.module';
import { getConfig } from '../db/data-source.config';
import { DisardaGecirilenSurelerPlanModule } from './disarda-gecirilen-sureler-plan/disarda-gecirilen-sureler-plan.module';
import { ProjeIlerlemeBilgilerPlanModule } from './proje-ilerleme-bilgiler-plan/proje-ilerleme-bilgiler-plan.module';
import { ProjeGelirBilgilerPlanModule } from './proje-gelir-bilgiler-plan/proje-gelir-bilgiler-plan.module';
import { ProjeGiderBilgilerPlanModule } from './proje-gider-bilgiler-plan/proje-gider-bilgiler-plan.module';
import { ProjeDisTicaretBilgilerPlanModule } from './proje-dis-ticaret-bilgiler-plan/proje-dis-ticaret-bilgiler-plan.module';
import { ProjeDisiDisTicaretBilgilerPlanModule } from './proje-disi-dis-ticaret-bilgiler-plan/proje-disi-dis-ticaret-bilgiler-plan.module';
import { ProjeDisiGelirBilgilerPlanModule } from './proje-disi-gelir-bilgiler-plan/proje-disi-gelir-bilgiler-plan.module';
import { ProjeDisiGiderBilgilerPlanModule } from './proje-disi-gider-bilgiler-plan/proje-disi-gider-bilgiler-plan.module';
import { FirmaMuafiyetBilgilerPlanModule } from './firma-muafiyet-bilgiler-plan/firma-muafiyet-bilgiler-plan.module';
import { BordroKayitlariModule } from './bordro-kayitlari/bordro-kayitlari.module';
import { DestekTipleriModule } from './destek-tipleri/destek-tipleri.module';
import { DestekTalepleriModule } from './destek-talepleri/destek-talepleri.module';
import { ProjeRaporlariModule } from './proje-raporlari/proje-raporlari.module';
import { SohbetlerModule } from './sohbetler/sohbetler.module';
import { SureclerModule } from './surecler/surecler.module';
import { FirebaseAdminModule } from './firebase-admin.module';
import { PdfAnalizModule } from './pdf-analiz/pdf-analiz.module';
import { MpAuthModule } from './mp-auth/mp-auth.module';
import { MpKullanicilarModule } from './mp-kullanicilar/mp-kullanicilar.module';
import { MpLoginKayitlariModule } from './mp-login-kayitlari/mp-login-kayitlari.module';
import { MpDokumanlarModule } from './mp-dokumanlar/mp-dokumanlar.module';
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
    FirebaseAdminModule,
    KullanicilarModule,
    AuthModule,
    LoginKayitlariModule,
    LogsModule,
    FirmalarModule,
    DonemModule,
    PersonelModule,
    IzinTuruModule,
    IzinTalepleriModule,
    IzinSureleriModule,
    ProjelerModule,
    RotaIzinleriModule,
    MailModule,
    EmailTemplatesModule,
    PdksModule,
    ResmitatillerModule,
    DisaridaGecirilenSurelerModule,
    DisaridaGecirilenFormModule,
    CalismaTuruModule,
    GorevlendirmeTuruModule,
    KullaniciDavetleriModule,
    ProjeIlerlemeBilgilerModule,
    FirmaMuafiyetBilgilerModule,
    MuafiyetTipleriModule,
    ProjeGelirBilgileriModule,
    BildirimlerModule,
    KullaniciBildirimleriModule,
    FirmaAbonelikleriModule,
    AbonelikPlanlariModule,
    FaturalarModule,
    OdemelerModule,
    FaturaBilgileriModule,
    ProjeGiderBilgileriModule,
    GiderTipleriModule,
    ProjeDisiGiderBilgileriModule,
    ProjeDisiGelirBilgileriModule,
    SiparislerModule,
    SozlesmelerModule,
    ProjeDisiDisTicaretBilgileriModule,
    PdksplanModule,
    SgkhizmetListesiModule,
    TeknokentlerModule,
    ProjeBasvuruModule,
    GorevListesiModule,
    ProjeDisTicaretBilgileriModule,
    KullaniciGruplariModule,
    GrupYetkileriModule,
    DisardaGecirilenSurelerPlanModule,
    ProjeIlerlemeBilgilerPlanModule,
    ProjeGelirBilgilerPlanModule,
    ProjeGiderBilgilerPlanModule,
    ProjeDisTicaretBilgilerPlanModule,
    ProjeDisiDisTicaretBilgilerPlanModule,
    ProjeDisiGelirBilgilerPlanModule,
    ProjeDisiGiderBilgilerPlanModule,
    FirmaMuafiyetBilgilerPlanModule,
    BordroKayitlariModule,
    DestekTipleriModule,
    DestekTalepleriModule,
    ProjeRaporlariModule,
    SohbetlerModule,
    SureclerModule,
    PdfAnalizModule,
    MpAuthModule,
    MpKullanicilarModule,
    MpLoginKayitlariModule,
    MpDokumanlarModule,
  ],
  controllers: [
    AppController,
    KullanicilarController,
    PersonelController
  ],
  providers: [
    AppService,
    KullanicilarService,
    PersonelService,
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
