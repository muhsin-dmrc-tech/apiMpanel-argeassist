import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { DisaridaGecirilenFormService } from './disarida-gecirilen-form.service';
import { CreateDisGorevDto } from './dto/create.dto';
import { UpdateDisGorevDto } from './dto/update.dto';
import { Response } from 'express';

@Controller('disarida-gecirilen-form')
export class DisaridaGecirilenFormController {
    constructor(
        private readonly disGorevTalepService: DisaridaGecirilenFormService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-upload-dataes')
    async getUploadDataes(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.disGorevTalepService.getUploadDataes();
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-talep-item/:id')
    async getTalep(
        @Request() req,
        @Param('id') DisGorevTalepID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!DisGorevTalepID) {
            throw new BadRequestException('Dıs Görev Talep ID gereklidir');
        }

        return this.disGorevTalepService.getTalep(req.user.userId, DisGorevTalepID);
    }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('dis-gorev-talepleri-seeing')
    @Get('get-dis-gorev-talepleri/:firmaId')
    async getTalepler(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') FirmaID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        return this.disGorevTalepService.getTalepler(req.user.userId, query, FirmaID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('dis-gorev-talepleri-seeing')
    @Get('pdf-import/:firmaId/:id')
    async pdfImport(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') FirmaID: number,
        @Param('id') DisGorevTalepID: number,
        @Res() res: Response
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        if (!DisGorevTalepID) {
            throw new BadRequestException('Dıs Görev Talep ID gereklidir');
        }

        try {
            const result = await this.disGorevTalepService.pdfImport(req.user.userId, DisGorevTalepID);
            if (result.pdf) {
                return res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'inline; filename=disarida-gecirilen-sure.pdf',
                    'Content-Length': Buffer.from(result.pdf, 'base64').length,
                }).send(result.pdf);
            }
            return res.json(result);
        } catch (error) {
            throw error;
        }
    }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('dis-gorev-talep-edit')
    @Post('create')
    async create(@Body() data: CreateDisGorevDto, @Request() req, @Res() res: Response) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        try {
            const result = await this.disGorevTalepService.create(req.user.userId, data);
            if (result.pdf) {
                return res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'inline; filename=disarida-gecirilen-sure.pdf',
                    'Content-Length': Buffer.from(result.pdf, 'base64').length,
                }).send(result.pdf);
            }
            return res.json(result);
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('dis-gorev-talep-edit')
    @Post('update')
    async update(@Body() data: UpdateDisGorevDto, @Request() req, @Res() res: Response) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        //return this.disGorevTalepService.update(req.user.userId, data);
        try {
            const result = await this.disGorevTalepService.update(req.user.userId, data);
            if (result.pdf) {
                return res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'inline; filename=disarida-gecirilen-sure.pdf',
                    'Content-Length': Buffer.from(result.pdf, 'base64').length,
                }).send(result.pdf);
            }
            return res.json(result);
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('dis-gorev-talep-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.disGorevTalepService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('dis-gorev-talep-delete')
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.disGorevTalepService.reload(req.user.userId, data);
    }
}
