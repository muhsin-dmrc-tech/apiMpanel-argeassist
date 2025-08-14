import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { KullaniciFirmalariService } from './kullanici-firmalari.service';
import { UpdateFirmaKullaniciDto } from './dto/iliskiupdate.dto';
import { DataSource } from 'typeorm';
import { KullaniciFirmalari } from './entities/kullanici-firmalari.entity';

@Controller('kullanici-firmalari')
export class KullaniciFirmalariController {
    constructor(
        private readonly kullaniciFirmaService: KullaniciFirmalariService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-firma-kullanicilari/:firmaId')
    async getFirmaKullanicilari(
        @Request() req,
        @Param('firmaId') firmaId: number,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!firmaId || firmaId < 1) {
            throw new BadRequestException('Firma kimliği gereklidir');
        }
        const rol = await this.dataSource.getRepository(KullaniciFirmalari).findOne({
            where: { KullaniciID: req.user.userId, FirmaID: firmaId },
        });

        if (!rol) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

        if (rol.Rol !== 'owner') {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.kullaniciFirmaService.getFirmaKullanicilari(req.user.userId, query, firmaId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-kullanici-firmalari')
    async getKullaniciFirmalari(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciFirmaService.getKullaniciFirmalari(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('full-kullanici-firmalari')
    async fullKullaniciFirmalari(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciFirmaService.fullKullaniciFirmalari(req.user.userId);
    }



    @UseGuards(JwtAuthGuard)
    @Post('update')
    async update(@Body() data: UpdateFirmaKullaniciDto, @Request() req) {
        console.log(data)
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciFirmaService.update(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciFirmaService.delete(req.user.userId, data);
    }

}
