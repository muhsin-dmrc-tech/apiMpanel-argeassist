import { BadRequestException, Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FaturalarService } from './faturalar.service';
import { DataSource } from 'typeorm';

@Controller('faturalar')
export class FaturalarController {
    constructor(
        private readonly faturalarService: FaturalarService,
        private readonly dataSource: DataSource,
    ) { }


    @UseGuards(JwtAuthGuard)
    @Get('/get-faturalar')
    async getFaturalar(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.faturalarService.getFaturalar(req.user.userId, query);
    }


}
