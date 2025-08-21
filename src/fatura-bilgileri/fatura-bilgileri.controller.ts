import { BadRequestException, Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FaturaBilgileriService } from './fatura-bilgileri.service';
import { CreateFaturaBilgiDto } from './dto/create.dto';
import { DataSource } from 'typeorm';

@Controller('fatura-bilgileri')
export class FaturaBilgileriController {
    constructor(
        private readonly faturaBilgileriService: FaturaBilgileriService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('/get-fatura-bilgi-item')
    async getFaturaBilgiItem(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.faturaBilgileriService.getFaturaBilgiItem(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('upload')
    async upload(@Body() data: CreateFaturaBilgiDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.faturaBilgileriService.upload(req.user.userId, data);
    }


}
