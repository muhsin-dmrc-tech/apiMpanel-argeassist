import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { KullaniciBildirimleriService } from './kullanici-bildirimleri.service';

@Controller('kullanici-bildirimleri')
export class KullaniciBildirimleriController {
    constructor(
        private readonly kullaniciBildirimleriService: KullaniciBildirimleriService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-bildirimler')
    async getBildirimler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.kullaniciBildirimleriService.getBildirimler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-user-bildirimler')
    async getUserBildirimler(
        @Request() req,
        @Query() query
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.kullaniciBildirimleriService.getUserBildirimler(req.user.userId, query);
    }
    @UseGuards(JwtAuthGuard)
    @Get('get-bildirim-arsiv')
    async getBildirimArsiv(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.kullaniciBildirimleriService.getUserBildirimArsiv(req.user.userId, query);
    }


    @UseGuards(JwtAuthGuard)
    @Post('all-as-read')
    async allAsRead(@Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.kullaniciBildirimleriService.allAsRead(req.user.userId);
    }
}
