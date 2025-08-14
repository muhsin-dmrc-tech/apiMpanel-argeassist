import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { SureclerService } from './surecler.service';

@Controller('surecler')
export class SureclerController {
    constructor(
        private readonly sureclerService: SureclerService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-surecler')
    async getActiveSurecler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sureclerService.getActiveSurecler();
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-surecadimlari')
    async getActiveSurecAdimlari(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sureclerService.getActiveSurecAdimlari();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-surecler')
    async getSurecler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sureclerService.getSurecler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sureclerService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sureclerService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('adim-upload')
    async adimlarUpload(@Body() data:any, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        console.log(data)
        return this.sureclerService.adimlarUpload(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('upload')
    async upload(@Body() data: { SurecAdi: string,Anahtar: string, ID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data.Anahtar || !data.SurecAdi) {
            throw new BadRequestException('Süreç adı ve anahtar zorunludur');
        }
        return this.sureclerService.upload(req.user.userId, data);
    }
}
