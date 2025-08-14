import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { BildirimlerService } from './bildirimler.service';
import { CreateTemplatesDto } from './dto/create.templates.dto';
import { UpdateTemplatesDto } from './dto/update.templates.dto';

@Controller('bildirimler')
export class BildirimlerController {
    constructor(
        private readonly bildirimlerService: BildirimlerService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-bildirim-item/:id')
    async getBildirim(
        @Request() req,
        @Param('id') BildirimID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!BildirimID) {
            throw new BadRequestException('Bildirim ID gereklidir');
        }

        return this.bildirimlerService.getBildirim(req.user.userId, BildirimID);
    }


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
        return this.bildirimlerService.getBildirimler(req.user.userId, query);
    }


   


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.bildirimlerService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.bildirimlerService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: CreateTemplatesDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.bildirimlerService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Request() req, @Body() data: UpdateTemplatesDto,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.bildirimlerService.update(req.user.userId, data);
    }


}
