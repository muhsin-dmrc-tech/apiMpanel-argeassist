import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles, Roles } from 'src/auth/roles.decorator';
import { ProjelerService } from './projeler.service';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { DataSource } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Controller('projeler')
export class ProjelerController {
    constructor(
        private readonly projeService: ProjelerService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-proje/:teknokentId/:id')
    async getProje(
        @Request() req,
        @Param('teknokentId') TeknokentID: number,
        @Param('id') ProjeID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!TeknokentID) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }

        if (!ProjeID) {
            throw new BadRequestException('Proje ID gereklidir');
        }

        return this.projeService.getProje(TeknokentID, ProjeID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
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
    @YetkiUserRoles('proje-seeing')
    @Get('/get-firma-projeler/:firmaId')
    async getFirmaProjeler(
        @Request() req,
        @Param('firmaId') FirmaID: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!FirmaID) {
            throw new BadRequestException('FirmaID gereklidir');
        }
        return this.projeService.getFirmaProjeler(FirmaID);
    }




    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-projeler/:firmaId')
    async getProjeler(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') firmaId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.getProjeler(req.user.userId, query, firmaId);
    }

    //Tekno Adminler için
    @UseGuards(JwtAuthGuard)
    @Get('get-projeler-teknoadmin')
    async getProjelerTeknoAdmin(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        const teknokullanici = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, Rol: 'owner', Tip: 3 },
        });
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (teknokullanici || (user.KullaniciTipi === 2 && user.role === 'admin')) {
            return this.projeService.getProjelerTeknoAdmin(req.user.userId, query, teknokullanici ? teknokullanici.IliskiID : null);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

    }

    //Tekno Adminler için
    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-tekno-aktif-projeler/:iliskiId')
    async getAktifProjelerTeknoAdmin(
        @Request() req,
        @Param('iliskiId') iliskiId: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.getAktifProjelerTeknoAdmin(req.user.userId, iliskiId);

    }

    //Tekno Adminler için
    @UseGuards(JwtAuthGuard)
    @Get('get-proje-item-teknoadmin/:id')
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

        const teknokullanici = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, Rol: 'owner', Tip: 3 },
        });
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (teknokullanici || (user.KullaniciTipi === 2 && user.role === 'admin')) {
            return this.projeService.getProjeDetayTeknoAdmin(ProjeID, teknokullanici ? teknokullanici.IliskiID : null);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }


    }

    @UseGuards(JwtAuthGuard)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }

        return this.projeService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(@Body() data: { ProjeAdi: string, FirmaID: number, TeknokentID: number, ProjeKodu: string, STBProjeKodu: string, BaslangicTarihi: string, BitisTarihi: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update')
    async update(@Body() data: { ProjeAdi: string, FirmaID: number, ProjeID: number, TeknokentID: number, ProjeKodu: string, STBProjeKodu: string, BaslangicTarihi: string, BitisTarihi: string }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeService.update(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('uzman-update')
    async uzmanUpdate(@Body() data: { itemValue: number[], TeknokentID: number, ProjeUzmanKullaniciID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }

        if (!data.TeknokentID || !data.ProjeUzmanKullaniciID || !data.itemValue) {
            throw new BadRequestException('TeknokentID, Proje Uzman Kullanici ID ve Proje seçimi zorunludur');
        }

        const teknokullanici = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, Rol: 'owner', Tip: 3 },
        });
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (teknokullanici || (user.KullaniciTipi === 2 && user.role === 'admin')) {
            return this.projeService.uzmanUpdate(req.user.userId, data);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

    }

    @UseGuards(JwtAuthGuard)
    @Post('hakem-update')
    async hakemUpdate(@Body() data: { itemValue: number[], TeknokentID: number, ProjeHakemKullaniciID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.TeknokentID || !data.ProjeHakemKullaniciID || !data.itemValue) {
            throw new BadRequestException('TeknokentID, Proje Hakem Kullanici ID ve Proje seçimi zorunludur');
        }


        const teknokullanici = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, Rol: 'owner', Tip: 3 },
        });
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: req.user.userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        if (user.KullaniciTipi === 1) {
            throw new BadRequestException(`Yetkisiz kullanıcı`);
        }
        if (teknokullanici || (user.KullaniciTipi === 2 && user.role === 'admin')) {
            return this.projeService.hakemUpdate(req.user.userId, data);
        } else {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

    }
}
