import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PdksService } from './pdks.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';

@Controller('pdks')
export class PdksController {
    constructor(
        private readonly pdksService: PdksService,
    ) { }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('pdks-seeing')
    @Get('get-pdks/:firmaId')
    async getPdks(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') FirmaID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.pdksService.getPdks(req.user.userId, query, FirmaID);
    }

    

}
