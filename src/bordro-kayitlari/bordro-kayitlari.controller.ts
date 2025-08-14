import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { BordroKayitlariService } from './bordro-kayitlari.service';

@Controller('bordro-kayitlari')
export class BordroKayitlariController {
    constructor(
        private readonly bordroKayitlariService: BordroKayitlariService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-item/:donemId/:personelId/:firmaId?')
    async getBordroKayit(
        @Request() req,
        @Param('donemId') DonemId: number,
        @Param('personelId') PersonelId: number | 'all',
        @Param('firmaId') FirmaId: number | null,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        
        if (!DonemId) {
            throw new BadRequestException('Dönem ID gereklidir');
        }
        if (!PersonelId) {
            throw new BadRequestException('Personel ID gereklidir');
        }

        return await this.bordroKayitlariService.getBordroKayit(req.user.userId, FirmaId, DonemId, PersonelId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('bordro-edit')
    @Post('upload')
    async upload(@Body() data: {
        PersonelID: number,
        DonemID: number,
        ExstraUcret: number,
        Not?: string,
        ArgeGunSayisi: number,
        VergiIstisnasiUygula?: boolean,
        BesPuanlikIndirimUygula?: boolean,
    }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.bordroKayitlariService.upload(req.user.userId, data);
    }
}
