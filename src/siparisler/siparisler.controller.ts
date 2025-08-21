import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SiparislerService } from './siparisler.service';
import { DataSource } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('siparisler')
export class SiparislerController {
    constructor(
        private readonly siparislerService: SiparislerService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('/get-odeme-bildirimleri')
    async getOdemeBildirimleri(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
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
        return this.siparislerService.getOdemeBildirimleri(req.user.userId, query);
    }



    @UseGuards(JwtAuthGuard)
    @Get('/get-siparisler')
    async getsiparisler(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.siparislerService.getsiparisler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-siparis-item/:id')
    async getSiparisItem(
        @Request() req,
        @Param('id') SiparisID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!SiparisID) {
            throw new BadRequestException('Siparis ID gereklidir');
        }

        return this.siparislerService.getSiparisItem(req.user.userId, SiparisID);
    }


    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(
        @Request() req,
        @Body() data: {AbonelikPlanID: number }
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.AbonelikPlanID && typeof data.AbonelikPlanID !== 'number') {
            throw new BadRequestException('Abonelik Plan ID gereklidir');
        }
        return this.siparislerService.create(req.user.userId, data);
    }
}
