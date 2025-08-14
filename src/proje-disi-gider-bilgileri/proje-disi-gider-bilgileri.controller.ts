import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { ProjeDisiGiderBilgileriService } from './proje-disi-gider-bilgileri.service';

@Controller('proje-disi-gider-bilgileri')
export class ProjeDisiGiderBilgileriController {
    constructor(
        private readonly projeDisiBilgiService: ProjeDisiGiderBilgileriService,
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-seeing')
    @Get('/get-gider-bilgi-item/:firmaId/:id')
    async getprojeDisiBilgiItem(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('id') ItemID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!ItemID) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        return this.projeDisiBilgiService.getprojeDisiBilgiItem(FirmaID, ItemID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-seeing')
    @Get('/get-gider-bilgi/:firmaId/:donemId/:giderTipiId')
    async getprojeDisiBilgi(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('donemId') DonemID: number,
        @Param('giderTipiId') GiderTipiID: number
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

        if (!GiderTipiID || GiderTipiID === 0) {
            throw new BadRequestException('GiderTipi ID gereklidir');
        }
        return this.projeDisiBilgiService.getprojeDisiBilgi(FirmaID, DonemID, GiderTipiID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-disi-gelir-gider-seeing')
    @Get('get-gider-bilgiler/:firmaId')
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
    async upload(@Body() data: { Gider: string, FirmaID: number, DonemID: number, TTOGiderimi: boolean, GiderTipiID: number, islemTipi: 1 | 2  }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.FirmaID || data.FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!data.DonemID || data.DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
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
