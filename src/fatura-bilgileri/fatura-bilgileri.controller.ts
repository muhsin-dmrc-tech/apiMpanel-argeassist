import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FaturaBilgileriService } from './fatura-bilgileri.service';
import { CreateFaturaBilgiDto } from './dto/create.dto';
import { DataSource } from 'typeorm';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('fatura-bilgileri')
export class FaturaBilgileriController {
    constructor(
        private readonly faturaBilgileriService: FaturaBilgileriService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('/get-fatura-bilgi-item/:firmaId')
    async getFaturaBilgiItem(
        @Request() req,
        @Param('firmaId') FirmaID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!FirmaID || FirmaID < 1) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        const rol = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, IliskiID: FirmaID,Tip:1 },
        });

        if (!rol) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }


        if (rol.Rol !== 'owner') {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.faturaBilgileriService.getFaturaBilgiItem(FirmaID);
    }

    @UseGuards(JwtAuthGuard)
    @Post('upload')
    async upload(@Body() data: CreateFaturaBilgiDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.FirmaID || data.FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!data.FirmaID || data.FirmaID < 1) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        const rol = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, IliskiID: data.FirmaID,Tip:1 },
        });

        if (!rol) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }


        if (rol.Rol !== 'owner') {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.faturaBilgileriService.upload(req.user.userId, data);
    }


}
