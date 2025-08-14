import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { KullaniciDavetleriService } from './kullanici-davetleri.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateFirmaKullaniciDto } from './dto/create.dto';

@Controller('kullanici-davetleri')
export class KullaniciDavetleriController {
    constructor(
        private readonly kullaniciDavetService: KullaniciDavetleriService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-davetler/:iliskiId')
    async getIliskiDavetleri(
        @Request() req,
        @Param('iliskiId') iliskiId: number,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!iliskiId) {
            throw new BadRequestException('İlişki kimliği gereklidir');
        }
        return this.kullaniciDavetService.getIliskiDavetleri(req.user.userId, query, iliskiId);
    }


    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(@Body() data: CreateFirmaKullaniciDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciDavetService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('cevap')
    async cevap(@Body() data: {DavetID:number,Cevap:string}, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.kullaniciDavetService.cevap(req.user.userId, data);
    }

}
