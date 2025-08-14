import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MobileAuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const origin = req.headers.origin;


        if (origin) {
            const allowedDomains = process.env.NODE_ENV !== 'production'
                ? ['http://localhost:5173','http://localhost:5174']
                : ['https://argeassist.com', 'https://panel.argeassist.com', 'https://www.panel.argeassist.com','https://musteri-paneli.argeassist.com'];

            if (!allowedDomains.includes(origin)) {
                return res.status(403).json({ message: 'Erişim izni verilmedi.' });
            }
        }
        if (!origin) {
            // Mobil client secret kontrolü
            const appKey = req.headers['x-app-key'] || req.headers['x-mobile-client-secret'];
            if (!appKey || appKey !== process.env.MOBILE_CLIENT_SECRET) {
                return res.status(403).json({ message: 'Geçersiz mobil istemci anahtarı.' });
            }
            // "/mobile" prefixini kaldır (gerçek route'a yönlendir)
            req.url = req.url.replace(/^\/mobile/, '');
        }



        next();
    }
}

