import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { ProjeDisiDisTicaretBilgileriService } from './proje-disi-dis-ticaret-bilgileri.service';

@Controller('proje-disi-dis-ticaret-bilgileri')
export class ProjeDisiDisTicaretBilgileriController {
    constructor(
        private readonly projeDisiBilgiService: ProjeDisiDisTicaretBilgileriService,
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-seeing')
    @Get('/get-dis-ticaret-bilgi-item/:firmaId/:id')
    async getprojeDisiBilgiItem(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('id') ItemID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!ItemID) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        return this.projeDisiBilgiService.getprojeDisiBilgiItem(FirmaID, ItemID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-seeing')
    @Get('/get-dis-ticaret-bilgi/:firmaId/:donemId/:ulke')
    async getprojeDisiBilgi(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('donemId') DonemID: number,
        @Param('ulke') Ulke: string
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!FirmaID || FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!DonemID || DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!Ulke || Ulke.length < 1) {
            throw new BadRequestException('Ulke gereklidir');
        }
        return this.projeDisiBilgiService.getprojeDisiBilgi(FirmaID, DonemID, Ulke);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-seeing')
    @Get('get-dis-ticaret-bilgiler/:firmaId')
    async getprojeDisiBilgiler(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') firmaId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!firmaId || firmaId === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        return this.projeDisiBilgiService.getprojeDisiBilgiler(req.user.userId, query, firmaId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-edit')
    @Post('upload')
    async upload(@Body() data: { Ithalat: string, Ihracat: string, FirmaID: number, DonemID: number, LisansGelirimi: boolean, Ulke: string, islemTipi:1|2 }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.FirmaID || data.FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!data.DonemID || data.DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!data.Ulke || data.Ulke.length < 1) {
            throw new BadRequestException('Ulke gereklidir');
        }
        return this.projeDisiBilgiService.upload(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.projeDisiBilgiService.delete(req.user.userId, data);
    }
}
