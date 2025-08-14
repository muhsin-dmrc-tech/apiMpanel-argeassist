import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FaturalarService } from './faturalar.service';
import { DataSource } from 'typeorm';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('faturalar')
export class FaturalarController {
    constructor(
        private readonly faturalarService: FaturalarService,
        private readonly dataSource: DataSource,
    ) { }


    @UseGuards(JwtAuthGuard)
    @Get('/get-faturalar/:firmaId')
    async getFaturalar(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') FirmaID: number,
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
        return this.faturalarService.getFaturalar(req.user.userId, query, FirmaID);
    }


}
