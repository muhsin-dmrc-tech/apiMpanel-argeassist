import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { MuafiyetTipleriService } from './muafiyet-tipleri.service';

@Controller('muafiyet-tipleri')
export class MuafiyetTipleriController {
    constructor(
            private readonly muafiyetTipiService: MuafiyetTipleriService,
        ) { }
    
        @UseGuards(JwtAuthGuard)
        @Get('get-active-muafiyet-tipleri')
        async getActiveTipler(
            @Request() req
        ) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            return this.muafiyetTipiService.getActiveTipler();
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Get('get-muafiyet-tipleri')
        async getTipler(
            @Request() req,
            @Query() query: any,
        ) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            return this.muafiyetTipiService.getTipler(req.user.userId, query);
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('delete')
        async delete(@Request() req, @Body() data: any,) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            return this.muafiyetTipiService.delete(req.user.userId, data);
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('reload')
        async reload(@Request() req, @Body() data: any,) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            return this.muafiyetTipiService.reload(req.user.userId, data);
        }
    
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('create')
        async create(@Body() data: { Tanim: string }, @Request() req) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            return this.muafiyetTipiService.create(req.user.userId, data);
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('update')
        async update(@Body() data: { Tanim: string, MuafiyetTipiID: number }, @Request() req) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            return this.muafiyetTipiService.update(req.user.userId, data);
        }
}
