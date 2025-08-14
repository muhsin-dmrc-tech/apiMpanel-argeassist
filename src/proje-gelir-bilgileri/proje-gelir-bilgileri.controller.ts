import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { ProjeGelirBilgileriService } from './proje-gelir-bilgileri.service';

@Controller('proje-gelir-bilgileri')
export class ProjeGelirBilgileriController {
    constructor(
        private readonly projeBilgiService: ProjeGelirBilgileriService,
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('/get-proje-bilgi-item/:firmaId/:id')
    async getProjeBilgiItem(
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
        return this.projeBilgiService.getProjeBilgiItem(FirmaID, ItemID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('/get-proje-bilgi/:firmaId/:projeId/:donemId/:gelirTipi')
    async getProjeBilgi(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('projeId') ProjeID: number,
        @Param('donemId') DonemID: number,
        @Param('gelirTipi') GelirTipi: string
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!FirmaID || FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!ProjeID || ProjeID === 0) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        if (!DonemID || DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!GelirTipi || GelirTipi.length < 1) {
            throw new BadRequestException('GelirTipi gereklidir');
        }
        return this.projeBilgiService.getProjeBilgi(FirmaID, ProjeID, DonemID,GelirTipi);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-proje-bilgiler/:firmaId')
    async getProjeBilgiler(
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
        return this.projeBilgiService.getProjeBilgiler(req.user.userId, query, firmaId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-edit')
    @Post('upload')
    async upload(@Body() data: { Gelir: string, ProjeID: number, FirmaID: number, DonemID: number, FSMHLisansGelirimi: boolean, TTOGelirimi: boolean, GelirTipi: string, islemTipi:1|2 }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.FirmaID || data.FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!data.ProjeID || data.ProjeID === 0) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        if (!data.DonemID || data.DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!data.GelirTipi || data.GelirTipi.length < 1) {
            throw new BadRequestException('GelirTipi gereklidir');
        }
        return this.projeBilgiService.upload(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.projeBilgiService.delete(req.user.userId, data);
    }
}
