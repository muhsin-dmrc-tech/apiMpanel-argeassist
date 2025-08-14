import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { RotaIzinleriService } from './rota-izinleri.service';

@Controller('rota-izinleri')
export class RotaIzinleriController {
    constructor(
        private readonly rotaIzinService: RotaIzinleriService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-rota-izinler')
    async getActiveIzinler(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.rotaIzinService.getActiveIzinler(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-rota-izinler')
    async getIzinler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.rotaIzinService.getIzinler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.rotaIzinService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.rotaIzinService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { Tanim: string, Anahtar: string, Type: string,Bolum: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.rotaIzinService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { Tanim: string, Anahtar: string, Type: string,Bolum: string, id: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.rotaIzinService.update(req.user.userId, data);
    }
}
