import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { LogsService } from './logs-tables/logs.service';
import { JwtService } from '@nestjs/jwt';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MobileAuthMiddleware } from './mobile-auth.middleware';

if (process.env.NODE_ENV !== 'production') {
  global.crypto = require('crypto');
}


async function bootstrap() {

  dotenv.config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Statik dosyaları serve et
  const publicPath = join(__dirname, '..','..', 'public');

  app.useStaticAssets(publicPath);

  // CORS ayarları
  app.enableCors({
    origin: (origin, callback) => {
      const allowedDomains = process.env.NODE_ENV !== 'production' ? 
      ['http://localhost:5173','http://localhost:5174'] : 
      ['https://argeassist.com', 'https://panel.argeassist.com', 'https://www.panel.argeassist.com','https://musteri-paneli.argeassist.com'];

      if (!origin || allowedDomains.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Erişim izni verilmedi.'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-appengine-country', 'x-forwarded-for', 'fastly-client-ip', 'X-App-Key','Platform'],
    credentials: true,
  });

// Sadece mobil endpoint'ler için middleware
  app.use(new MobileAuthMiddleware().use);

  // Proxy güven ayarı - düzeltilmiş versiyonu
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO'da tanımlanmayan özellikleri kaldırır
    forbidNonWhitelisted: false, // DTO'da tanımlanmayan özellikler için hata fırlatır
    transform: true, // Otomatik tip dönüşümü sağlar
  }));
  // Global exception filter'ı ekle
  const logsService = app.get(LogsService);
  const jwtService = app.get(JwtService);
  app.useGlobalFilters(new AllExceptionsFilter(logsService, jwtService));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "validator.swagger.io"],
          connectSrc: ["'self'"],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
    }),
  );
  await app.listen(5005);
  //await app.listen(5005,'192.168.1.2');
  console.log('Backend çalışıyor: http://localhost:5005');
}
bootstrap();
