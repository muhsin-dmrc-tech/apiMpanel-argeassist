import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { PersonelService } from './personel.service';
import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { CreatePersonelDto } from './dto/create.dto';
import { UpdatePersonelDto } from './dto/update.dto';
import { UpdateIliskiDto } from './dto/iliskiupdate.dto';
import { DataSource } from 'typeorm';
import { Personel } from './entities/personel.entity';

@Controller('personel')
export class PersonelController {
    constructor(
        private readonly personelService: PersonelService,
        private readonly dataSource: DataSource,
    ) { }


   /*  @UseGuards(JwtAuthGuard)
    @Get('full-kullanici-firmalari')
    async fullKullaniciFirmalari(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.fullKullaniciFirmalari(req.user.userId);
    } */

    /* @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-seeing')
    @Get('personel-firma-disinda-kayitlari/:iliskiId/:personelId')
    async firmaDisindaKayitlar(
        @Request() req,
        @Param('iliskiId') IliskiID: number,
        @Param('personelId') PersonelID: number,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!IliskiID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        if (!PersonelID) {
            throw new BadRequestException('Personel ID gereklidir');
        }

        return this.personelService.firmaDisindaKayitlar(IliskiID, PersonelID, query);
    } */

    /* @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-seeing')
    @Get('get-personel/:iliskiId/:id')
    async getPersonel(
        @Request() req,
        @Param('iliskiId') IliskiID: number,
        @Param('id') PersonelID: number,
        @Query() query:any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!IliskiID) {
            throw new BadRequestException('Iliski ID gereklidir');
        }

        if (!PersonelID) {
            throw new BadRequestException('Personel ID gereklidir');
        }

        return this.personelService.getPersonel(IliskiID, PersonelID,query);
    } */

    /* @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-seeing')
    @Get('personeller-izinbilgisi/:iliskiId/:donemId')
    async personellerIzinBilgisi(
        @Request() req,
        @Param('iliskiId') IliskiID: number,
        @Param('donemId') DonemID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!IliskiID) {
            throw new BadRequestException('Iliski ID gereklidir');
        }

        if (!DonemID) {
            throw new BadRequestException('Donem ID gereklidir');
        }

        return this.personelService.personellerIzinBilgisi(IliskiID, DonemID);
    } */

    /* @UseGuards(JwtAuthGuard)
    @Get('/get-personeller-query/:iliskiId')
    async getPersonellerQuery(
        @Request() req,
        @Query() query: any,
        @Param('iliskiId') IliskiID: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.getPersonellerQuery(req.user.userId, query, IliskiID);
    } */


    /* @UseGuards(JwtAuthGuard)
    @Get('/get-personeller/:iliskiId')
    async getPersoneller(
        @Request() req,
        @Param('iliskiId') IliskiID: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.getPersoneller(IliskiID);
    } */


   /*  @UseGuards(JwtAuthGuard)
    @Get('get-iliski-kullanicilari')
    async getIliskiKullanicilari(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.getIliskiKullanicilari(req.user.userId);
    } */

    /* @UseGuards(JwtAuthGuard)
    @Get('iliski-kullanicilari-query/:iliskiId')
    async iliskiKullanicilariQuery(
        @Request() req,
        @Param('iliskiId') iliskiId: number,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!iliskiId || iliskiId < 1) {
            throw new BadRequestException('İlişki kimliği gereklidir');
        }
        const rol = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: req.user.userId, IliskiID: iliskiId },
        });

        if (!rol) {
            throw new ForbiddenException('Kullanıcı yetkisi yok')
        }

        if (rol.Rol !== 'owner') {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }
        return this.personelService.iliskiKullanicilariQuery(req.user.userId, query, iliskiId);
    } */



   /*  @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.delete(req.user.userId, data);
    } */

    /* @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-delete')
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.reload(req.user.userId, data);
    } */


    /* @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-edit')
    @Post('create')
    async create(@Body() data: CreatePersonelDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.create(req.user.userId, data);
    } */

    /* @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('personel-edit')
    @Post('update')
    async update(@Body() data: UpdatePersonelDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.update(req.user.userId, data);
    }
 */


    /* @UseGuards(JwtAuthGuard)
    @Post('iliski-update')
    async iliskiUpdate(@Body() data: UpdateIliskiDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.iliskiUpdate(req.user.userId, data);
    } */

  /*   @UseGuards(JwtAuthGuard)
    @Post('iliski-delete')
    async iliskiDelete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.personelService.iliskiDelete(req.user.userId, data);
    } */

}
