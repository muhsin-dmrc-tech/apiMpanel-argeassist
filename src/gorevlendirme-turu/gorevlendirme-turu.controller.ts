import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { GorevlendirmeTuruService } from './gorevlendirme-turu.service';

@Controller('gorevlendirme-turu')
export class GorevlendirmeTuruController {
    constructor(
        private readonly gorevlendirmeTuruService: GorevlendirmeTuruService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-gorevlendirme-turleri')
    async getActiveTurler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.gorevlendirmeTuruService.getActiveTurler();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-gorevlendirme-turleri')
    async getTurler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.gorevlendirmeTuruService.getTurler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.gorevlendirmeTuruService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.gorevlendirmeTuruService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { Tanim: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.gorevlendirmeTuruService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { Tanim: string, GorevlendirmeTuruID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.gorevlendirmeTuruService.update(req.user.userId, data);
    }
}
