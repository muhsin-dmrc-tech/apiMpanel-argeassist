import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles, Roles } from 'src/auth/roles.decorator';
import { ProjelerService } from './projeler.service';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { DataSource } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('projeler')
export class ProjelerController {
    constructor(
        private readonly projeService: ProjelerService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('abonelik')
    @Get('get-proje/:id')
    async getProje(
        @Request() req,
        @Param('id') ProjeID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!ProjeID) {
            throw new BadRequestException('Proje ID gereklidir');
        }

        return this.projeService.getProje(ProjeID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('abonelik')
    @Get('get-active-projeler')
    async getActiveProjeler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.getActiveProjeler();
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('abonelik')
    @Get('/get-firma-projeler')
    async getFirmaProjeler(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.projeService.getFirmaProjeler(req.user.userId);
    }




    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('abonelik')
    @Get('get-projeler')
    async getProjeler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.getProjeler(req.user.userId, query);
    }

    //Tekno Adminler için
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-projeler-admin')
    async getProjelerAdmin(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (user.KullaniciTipi === 2) {
            return this.projeService.getProjelerAdmin(req.user.userId, query);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

    }

    //Tekno Adminler için
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-aktif-projeler')
    async getAktifProjelerAdmin(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.getAktifProjelerAdmin(req.user.userId);

    }

    //Tekno Adminler için
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-proje-item-admin/:id')
    async getProjeDetayTeknoAdmin(
        @Request() req,
        @Param('id') ProjeID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!ProjeID) {
            throw new BadRequestException('Proje ID gereklidir');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (user.KullaniciTipi === 2) {
            return this.projeService.getProjeDetayAdmin(ProjeID);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }


    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }

        return this.projeService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { ProjeAdi: string, TeknokentID: number, ProjeKodu: string, STBProjeKodu: string, BaslangicTarihi: string, BitisTarihi: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { ProjeAdi: string, ProjeID: number, TeknokentID: number, ProjeKodu: string, STBProjeKodu: string, BaslangicTarihi: string, BitisTarihi: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.update(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('uzman-update')
    async uzmanUpdate(@Body() data: { itemValue: number[], TeknokentID: number, ProjeUzmanKullaniciID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }

        if (!data.TeknokentID || !data.ProjeUzmanKullaniciID || !data.itemValue) {
            throw new BadRequestException('TeknokentID, Proje Uzman Kullanici ID ve Proje seçimi zorunludur');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (user.KullaniciTipi === 2) {
            return this.projeService.uzmanUpdate(req.user.userId, data);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('hakem-update')
    async hakemUpdate(@Body() data: { itemValue: number[], TeknokentID: number, ProjeHakemKullaniciID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.TeknokentID || !data.ProjeHakemKullaniciID || !data.itemValue) {
            throw new BadRequestException('TeknokentID, Proje Hakem Kullanici ID ve Proje seçimi zorunludur');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (user.KullaniciTipi === 2) {
            return this.projeService.hakemUpdate(req.user.userId, data);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

    }
}
