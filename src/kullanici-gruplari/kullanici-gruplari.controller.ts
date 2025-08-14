import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DataSource } from 'typeorm';
import { KullaniciGruplariService } from './kullanici-gruplari.service';
import { CreateGrupKullaniciDto } from './dto/create.dto';
import { UpdateGrupKullaniciDto } from './dto/update.dto';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('kullanici-gruplari')
export class KullaniciGruplariController {
    constructor(
        private readonly kullaniciGrupService: KullaniciGruplariService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-gruplar/:iliskiId')
    async getGruplar(
        @Request() req,
        @Param('iliskiId') IliskiID: number,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!IliskiID || IliskiID < 1) {
            throw new BadRequestException('Iliski ID gereklidir');
        }
        const rol = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, IliskiID: IliskiID },
        });

        if (!rol) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

        if (rol.Rol !== 'owner') {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.kullaniciGrupService.getGruplar(req.user.userId, query, IliskiID);
    }


    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(@Body() data: CreateGrupKullaniciDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciGrupService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update')
    async update(@Body() data: UpdateGrupKullaniciDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciGrupService.update(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciGrupService.delete(req.user.userId, data);
    }

}
