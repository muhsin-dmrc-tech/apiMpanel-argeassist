import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Get, Request, Query, Param, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SgkhizmetListesiService } from './sgkhizmet-listesi.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { Response } from 'express';

@Controller('sgkhizmet-listesi')
export class SgkhizmetListesiController {
    constructor(
        private readonly sigortaliService: SgkhizmetListesiService
    ) { }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('sgkhizmet-listesi-seeing')
    @Get('/get-liste-detay/:firmaId/:id')
    async getListeDetay(
        @Request() req,
        @Param('firmaId') FirmaID: number,
        @Param('id') ListeID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        if (!ListeID) {
            throw new BadRequestException('Liste ID gereklidir');
        }
        return this.sigortaliService.getListeDetay(FirmaID, ListeID);
    }

   

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('sgkhizmet-listesi-seeing')
    @Get('get-sgkhizmet-listesi/:firmaId')
    async getSgkhizmetListesi(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') firmaId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.sigortaliService.getSgkhizmetListesi(req.user.userId, query, firmaId);
    }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('sgkhizmet-listesi-edit')
    @Post('/upload/:firmaId')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'application/pdf') {
                return cb(new BadRequestException('Sadece PDF dosyaları yüklenebilir'), false);
            }
            cb(null, true);
        }
    })
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('firmaId') firmaId: number) {
        if (!file) {
            throw new BadRequestException('Dosya yüklenemedi');
        }

        try {
            const jsonData = await this.sigortaliService.parsePdf(file.path);
            const result = await this.sigortaliService.saveHizmetListesi(firmaId, jsonData);

            // İşlem bittikten sonra yüklenen dosyayı sil
            fs.unlinkSync(file.path);

            return result;
        } catch (error) {
            // Hata durumunda da dosyayı sil
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('sgkhizmet-listesi-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.sigortaliService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('sgkhizmet-listesi-delete')
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.sigortaliService.reload(req.user.userId, data);
    }
}
