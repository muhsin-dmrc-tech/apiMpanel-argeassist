import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SozlesmelerService } from './sozlesmeler.service';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('sozlesmeler')
export class SozlesmelerController {
    constructor(
        private readonly sozlesmelerService: SozlesmelerService,
    ) { }

    @Get('/get-sozlesme-item/:anahtar')
    async getSozlesmeItem(
        @Param('anahtar') anahtar: string,
    ) {
        if (!anahtar) {
            throw new BadRequestException('Anahtar kimliği gereklidir');
        }
        return this.sozlesmelerService.getSozlesmeItem(anahtar);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('/get-sozlesmeler')
    async getSozlesmeler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.sozlesmelerService.getSozlesmeler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sozlesmelerService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sozlesmelerService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { Anahtar: string, Aciklama: string, Baslik: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sozlesmelerService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { Anahtar: string, Aciklama: string, Baslik: string, SozlesmeID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sozlesmelerService.update(req.user.userId, data);
    }
}
