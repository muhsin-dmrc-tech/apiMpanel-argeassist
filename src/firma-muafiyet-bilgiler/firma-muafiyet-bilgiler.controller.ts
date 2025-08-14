import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles, Roles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { FirmaMuafiyetBilgilerService } from './firma-muafiyet-bilgiler.service';

@Controller('firma-muafiyet-bilgiler')
export class FirmaMuafiyetBilgilerController {
    constructor(
        private readonly firmaMuafiyetService: FirmaMuafiyetBilgilerService,
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-muafiyetleri-seeing')
    @Get('get-muafiyet-bilgisi/:firmaId/:id')
    async getMuafiyetBilgi(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('id') MuafiyetBilgiID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        if (!MuafiyetBilgiID) {
            throw new BadRequestException('Muafiyet Bilgisi ID gereklidir');
        }

        return this.firmaMuafiyetService.getMuafiyetBilgi(FirmaID, MuafiyetBilgiID);
    }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-muafiyetleri-seeing')
    @Get('get-firma-muafiyetleri/:firmaId')
    async getFirmaMuafiyetler(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') firmaId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.firmaMuafiyetService.getFirmaMuafiyetler(req.user.userId, query, firmaId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-muafiyetleri-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmaMuafiyetService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-muafiyetleri-delete')
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmaMuafiyetService.reload(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-muafiyetleri-edit')
    @Post('create')
    async create(@Body() data: { DonemID: number, FirmaID: number, MuafiyetTipiID: number, MuafiyetTutari: string, Matrah: string, islemTipi: 1 | 2 }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.firmaMuafiyetService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-muafiyetleri-edit')
    @Post('update')
    async update(@Body() data: { DonemID: number, FirmaID: number, MuafiyetTipiID: number, MuafiyetTutari: string, Matrah: string, id: number, islemTipi: 1 | 2 }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.firmaMuafiyetService.update(req.user.userId, data);
    }

}
