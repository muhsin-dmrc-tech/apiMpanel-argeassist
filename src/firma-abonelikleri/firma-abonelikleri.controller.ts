import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FirmaAbonelikleriService } from './firma-abonelikleri.service';
import { DataSource } from 'typeorm';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('firma-abonelikleri')
export class FirmaAbonelikleriController {
    constructor(
        private readonly firmaAbonelikService: FirmaAbonelikleriService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-abonelikler/:firmaId')
    async getAktifAbonelikler(
        @Request() req,
        @Param('firmaId') firmaId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!firmaId || firmaId < 1) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        const rol = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, IliskiID: firmaId,Tip:1  },
        });

        if (!rol) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }


        if (rol.Rol !== 'owner') {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.firmaAbonelikService.getAktifAbonelikler(req.user.userId, firmaId);
    }


    @UseGuards(JwtAuthGuard)
    @Get('get-kullanici-firmalari')
    async getKullaniciFirmalari(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.firmaAbonelikService.getKullaniciFirmalari(req.user.userId, query);
    }





}
