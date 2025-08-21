import { BadRequestException, Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FirmaAbonelikleriService } from './firma-abonelikleri.service';
import { DataSource } from 'typeorm';

@Controller('firma-abonelikleri')
export class FirmaAbonelikleriController {
    constructor(
        private readonly firmaAbonelikService: FirmaAbonelikleriService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-abonelikler')
    async getAktifAbonelikler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.firmaAbonelikService.getAktifAbonelikler(req.user.userId);
    }


  

}
