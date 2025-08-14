import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { ProjeDisTicaretBilgileriService } from './proje-dis-ticaret-bilgileri.service';

@Controller('proje-dis-ticaret-bilgileri')
export class ProjeDisTicaretBilgileriController {
    constructor(
        private readonly projeBilgiService: ProjeDisTicaretBilgileriService,
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('/get-dis-ticaret-bilgi-item/:firmaId/:id')
    async getprojeBilgiItem(
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
        return this.projeBilgiService.getprojeBilgiItem(FirmaID, ItemID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('/get-dis-ticaret-bilgi/:firmaId/:projeId/:donemId/:ulke')
    async getprojeBilgi(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('projeId') ProjeID: number,
        @Param('donemId') DonemID: number,
        @Param('ulke') Ulke: string
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
        if (!Ulke || Ulke.length < 1) {
            throw new BadRequestException('Ülke gereklidir');
        }
        return this.projeBilgiService.getprojeBilgi(FirmaID,ProjeID, DonemID, Ulke);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-dis-ticaret-bilgiler/:firmaId')
    async getprojeBilgiler(
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
        return this.projeBilgiService.getprojeBilgiler(req.user.userId, query, firmaId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-edit')
    @Post('upload')
    async upload(@Body() data: { Ithalat: string, Ihracat: string, ProjeID: number, DonemID: number, FSMHLisansGelirimi: boolean, Ulke: string, islemTipi: 1 | 2 }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.ProjeID || data.ProjeID === 0) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        if (!data.DonemID || data.DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!data.Ulke || data.Ulke.length < 1) {
            throw new BadRequestException('Ulke gereklidir');
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
