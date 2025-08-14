import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { GiderTipleriService } from './gider-tipleri.service';

@Controller('gider-tipleri')
export class GiderTipleriController {
    constructor(
        private readonly giderTipiService: GiderTipleriService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-gider-tipleri')
    async getActiveTipler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.giderTipiService.getActiveTipler();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-gider-tipleri')
    async getTipler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.giderTipiService.getTipler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.giderTipiService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.giderTipiService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { Tanim: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.giderTipiService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { Tanim: string, GiderTipiID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.giderTipiService.update(req.user.userId, data);
    }
}
