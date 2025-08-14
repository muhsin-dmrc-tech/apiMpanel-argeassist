import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ResmitatillerService } from './resmitatiller.service';

@Controller('resmitatiller')
export class ResmitatillerController {
    constructor(
            private readonly resmiTatilService: ResmitatillerService,
        ) { }
          
    
        @UseGuards(JwtAuthGuard, RolesGuard)
            @Roles(2)
            @Get('get-resmi-tatiller')
            async getResmiTatiller(
                @Request() req,
                @Query() query: any,
            ) {
                if (!req.user.userId) {
                    throw new BadRequestException('Kullanıcı kimliği gereklidir');
                }
                return this.resmiTatilService.getResmiTatiller(req.user.userId, query);
            }
        
            @UseGuards(JwtAuthGuard, RolesGuard)
            @Roles(2)
            @Post('delete')
            async delete(@Request() req, @Body() data: any,) {
                if (!req.user.userId) {
                    throw new BadRequestException('Kullanıcı kimliği gereklidir');
                }
                return this.resmiTatilService.delete(req.user.userId, data);
            }
        
                  
        
            @UseGuards(JwtAuthGuard, RolesGuard)
            @Roles(2)
            @Post('create')
            async create(@Body() data: { ResmiTatil: string, Tarih: string}, @Request() req) {
                if (!req.user.userId) {
                    throw new BadRequestException('Kullanıcı kimliği gereklidir');
                }
                return this.resmiTatilService.create(req.user.userId, data);
            }
        
            @UseGuards(JwtAuthGuard, RolesGuard)
            @Roles(2)
            @Post('update')
            async update(@Body() data: { ResmiTatil: string, Tarih: string, ResmiTatilID: number }, @Request() req) {
                if (!req.user.userId) {
                    throw new BadRequestException('Kullanıcı kimliği gereklidir');
                }
                return this.resmiTatilService.update(req.user.userId, data);
            }
}
