import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles, Roles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { GorevListesiService } from './gorev-listesi.service';
import { DataSource } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('gorev-listesi')
export class GorevListesiController {
    constructor(
        private readonly gorevlistesiService: GorevListesiService,
        private readonly dataSource: DataSource,
    ) { }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-gorev-listesi/:firmaId/:projeId/:donemId')
    async getGorevListesi(
        @Request() req,
        @Param('firmaId') firmaId: number,
        @Param('projeId') projeId: number,
        @Param('donemId') donemId: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.gorevlistesiService.getGorevListesi(req.user.userId, projeId, firmaId, donemId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-gorev-listesi-teknoadmin/:iliskiId/:projeId/:donemId')
    async getGorevListesiTeknoAdmin(
        @Request() req,
        @Param('projeId') projeId: number,
        @Param('donemId') donemId: number,
        @Param('iliskiId') iliskiId: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.gorevlistesiService.getGorevListesiTeknoAdmin(req.user.userId, projeId, donemId, iliskiId);

    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('teknoadmin-gorev-detay/:iliskiId/:projeId/:donemId/:anahtar')
    async teknoAdminGorevDetay(
        @Request() req,
        @Param('projeId') projeId: number,
        @Param('donemId') donemId: number,
        @Param('anahtar') anahtar: string,
        @Param('iliskiId') iliskiId: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
      return this.gorevlistesiService.teknoAdminGorevDetay(req.user.userId, projeId, donemId, iliskiId, anahtar);

    }

    @UseGuards(JwtAuthGuard)
    @Post('add-gorev-kullanici')
    async addGorevKullanici(@Body() data: { GorevID: number, FirmaID: number, KullaniciID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.gorevlistesiService.addGorevKullanici(req.user.userId, data);
    }
}
