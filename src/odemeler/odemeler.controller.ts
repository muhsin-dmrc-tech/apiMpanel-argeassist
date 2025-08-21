import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, Request, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { OdemelerService } from './odemeler.service';
import { CreateOdemeDto } from './dto/create.dto';
import { Response, Request as RequestType } from 'express';
import { DataSource } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';

@Controller('odemeler')
export class OdemelerController {
    constructor(
        private readonly odemelerService: OdemelerService,
        private readonly dataSource: DataSource
    ) { }

    @Post('sonuc')
    async paytrOdemeSonucu(@Req() req: RequestType, @Res() res: Response) {
        const paytrAllowedIP = '185.103.231.10'; // PayTR'ın IP adresini buraya ekle
        const origin = req.headers.origin || req.headers.referer;
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (clientIp !== paytrAllowedIP) {
            return res.status(403).json({ message: 'Erişim izni verilmedi.' });
        }

        // PayTR'a özel CORS ayarı
        res.setHeader('Access-Control-Allow-Origin', ['https://paytr.com', 'https://www.paytr.com']);
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        return this.odemelerService.sonuc(req, res);
    }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(
        @Request() req,
        @Body() data: CreateOdemeDto
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.odemelerService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('odeme-onay')
    async odemeOnay(
        @Request() req,
        @Body() data: { SiparisID: number }
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: req.user.userId },
        });

        if (!user) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }


        if (user.KullaniciTipi !== 2) {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.odemelerService.odemeOnay(req.user.userId, data.SiparisID);
    }

}
