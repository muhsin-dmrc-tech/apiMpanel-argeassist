import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { DonemService } from './donem.service';

@Controller('donem')
export class DonemController {
 constructor(
        private readonly donemService: DonemService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-donemler')
    async getActiveDonemler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.donemService.getActiveDonemler();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Get('get-donemler')
        async getDonemler(
            @Request() req,
            @Query() query: any,
        ) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı kimliği gereklidir');
            }
            return this.donemService.getDonemler(req.user.userId, query);
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('delete')
        async delete(@Request() req, @Body() data: any,) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı kimliği gereklidir');
            }
            return this.donemService.delete(req.user.userId, data);
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('reload')
        async reload(@Request() req, @Body() data: any,) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı kimliği gereklidir');
            }
            return this.donemService.reload(req.user.userId, data);
        }
    
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('create')
        async create(@Body() data: { DonemAdi: string, Ay: number, Yil: number}, @Request() req) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı kimliği gereklidir');
            }
            return this.donemService.create(req.user.userId, data);
        }
    
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles(2)
        @Post('update')
        async update(@Body() data: { DonemAdi: string, Ay: number, Yil: number, DonemID: number }, @Request() req) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı kimliği gereklidir');
            }
            return this.donemService.update(req.user.userId, data);
        }

}
