import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { FirmaMuafiyetBilgilerPlanService } from './firma-muafiyet-bilgiler-plan.service';

@Controller('firma-muafiyet-bilgiler-plan')
export class FirmaMuafiyetBilgilerPlanController {
    constructor(
        private readonly planService: FirmaMuafiyetBilgilerPlanService,
    ) { }

    /*  @UseGuards(JwtAuthGuard)
     @Get('get-active-planlar')
     async getActivePdksPlanlar(
         @Request() req
     ) {
         if (!req.user.userId) {
             throw new BadRequestException('Kullanıcı Kimliği gereklidir');
         }
         return this.planService.getActivePlanlar();
     } */



    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-planlar')
    async getPdksPlanlar(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.planService.getPlanlar(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.planService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('durum-update')
    async durumUpdate(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.planService.durumUpdate(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { Durum: boolean, FirmaID: number, DonemID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.planService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Body() data: { Durum: boolean, FirmaID: number, DonemID: number, FirmaMuafiyetBilgilerPlanID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.planService.update(req.user.userId, data);
    }
}
