import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles, Roles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { ProjeIlerlemeBilgilerService } from './proje-ilerleme-bilgiler.service';

@Controller('proje-ilerleme-bilgiler')
export class ProjeIlerlemeBilgilerController {
    constructor(
        private readonly projeBilgiService: ProjeIlerlemeBilgilerService,
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
        return this.projeBilgiService.getProjeBilgiItem(FirmaID,ItemID );
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('/get-proje-bilgi/:firmaId/:projeId/:donemId')
    async getProjeBilgi(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('projeId') ProjeID: number,
        @Param('donemId') DonemID: number
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
        return this.projeBilgiService.getProjeBilgi(FirmaID, ProjeID, DonemID);
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
    async upload(@Body() data: { Bilgi: string, FirmaID: number, ProjeID: number, DonemID: number, islemTipi:1|2}, @Request() req) {
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
