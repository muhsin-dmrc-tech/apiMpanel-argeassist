import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { DestekTipleriService } from './destek-tipleri.service';

@Controller('destek-tipleri')
export class DestekTipleriController {
    constructor(
        private readonly DestekTipiService: DestekTipleriService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-destek-tipleri/:Departman')
    async getActiveTipler(
        @Request() req,
        @Param('Departman') Departman: string,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!Departman) {
            throw new BadRequestException('Departman gereklidir');
        }
        return this.DestekTipiService.getActiveTipler(Departman);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-destek-tipleri')
    async getTipler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.DestekTipiService.getTipler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.DestekTipiService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.DestekTipiService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { Tanim: string, Departman:string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.DestekTipiService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { Tanim: string, Departman:string, DestekTipiID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.DestekTipiService.update(req.user.userId, data);
    }
}
