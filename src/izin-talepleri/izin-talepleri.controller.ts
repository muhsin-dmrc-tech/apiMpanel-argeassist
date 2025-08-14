import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { IzinTalepleriService } from './izin-talepleri.service';
import { CheckedItemDto, GunlerCheckedDto, ItemValueDto, UpdateItemValueDto } from './dto/create.dto';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { IzinTuru } from 'src/izin-turu/entities/izin-turu.entity';
import { Response } from 'express';
import * as mime from 'mime-types';

@Controller('izin-talepleri')
export class IzinTalepleriController {
    constructor(
        private readonly izinTalepService: IzinTalepleriService,
        private readonly dataSource: DataSource
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-upload-dataes')
    async getUploadDataes(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.izinTalepService.getUploadDataes();
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-izin-talep-item/:id')
    async getTalep(
        @Request() req,
        @Param('id') IzinTalepID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!IzinTalepID) {
            throw new BadRequestException('Izin Talep ID gereklidir');
        }

        return await this.izinTalepService.getTalep(req.user.userId, IzinTalepID);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-izin-talep-file/:id')
    async getImportFile(
        @Request() req,
        @Param('id') IzinTalepID: number,
        @Res() res: Response
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!IzinTalepID) {
            throw new BadRequestException('Izin Talep ID gereklidir');
        }

        try {
            const result = await this.izinTalepService.getImportFile(req.user.userId, IzinTalepID);
            if (result.base64PDF) {
                const mimeType = mime.lookup(result.EkDosya) || 'application/octet-stream';
                return res.set({
                    'Content-Type': mimeType,
                    'Content-Disposition': `attachment; filename="${path.basename(result.EkDosya)}"`,
                    'Content-Length': result.base64PDF.length.toString()
                }).send(result.base64PDF);
            }
            return res.json(result);
        } catch (error) {
            throw error;
        }
    }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('izin-talepleri-seeing')
    @Get('get-izin-talepleri/:firmaId')
    async getTalepler(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') FirmaID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.izinTalepService.getTalepler(req.user.userId, query, FirmaID);
    }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('izin-talepleri-edit')
    @Post('create/:firmaId')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) {
                return cb(new BadRequestException('Sadece pdf, text, word vb. dosyaları yüklenebilir'), false);
            }
            cb(null, true);
        }
    }))
    async create(@Body() rawData: any, @UploadedFile() file: Express.Multer.File, @Request() req) {
        const itemValue: ItemValueDto = JSON.parse(rawData.itemValue);
        const checkedItems: CheckedItemDto[] = JSON.parse(rawData.checkedItems);
        const gunlerChecked: GunlerCheckedDto = JSON.parse(rawData.gunlerChecked);
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (itemValue.IzinTuruID !== 0) {
            const izinTuru = await this.dataSource.getRepository(IzinTuru).findOne({
                where: { IzinTuruID: itemValue.IzinTuruID }
            });
            if (!izinTuru) {
                throw new BadRequestException('İzin Türü bulunamadı');
            }
            if (izinTuru.Ek === true && izinTuru.EkAdi && izinTuru.EkAdi.length > 0) {
                if (!file) {
                    throw new BadRequestException('Ek gereklidir');
                }
            }
        } else {
            throw new BadRequestException('İzin Türü gereklidir');
        }
        const ekDosya = file?.path ?? null;
        try {
            const result = await this.izinTalepService.create(req.user.userId, { itemValue, checkedItems, gunlerChecked }, ekDosya);
            return result;
        } catch (error) {
            // Hata durumunda da dosyayı sil
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            console.log(error)
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('izin-talepleri-edit')
    @Post('update/:firmaId')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) {
                return cb(new BadRequestException('Sadece pdf, text, word vb. dosyaları yüklenebilir'), false);
            }
            cb(null, true);
        }
    }))
    async update(@Body() rawData: any, @UploadedFile() file: Express.Multer.File, @Request() req) {
        const itemValue: UpdateItemValueDto = JSON.parse(rawData.itemValue);
        const checkedItems: CheckedItemDto[] = JSON.parse(rawData.checkedItems);
        const gunlerChecked: GunlerCheckedDto = JSON.parse(rawData.gunlerChecked);
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (itemValue.IzinTuruID !== 0) {
            const izinTuru = await this.dataSource.getRepository(IzinTuru).findOne({
                where: { IzinTuruID: itemValue.IzinTuruID }
            });
            if (!izinTuru) {
                throw new BadRequestException('İzin Türü bulunamadı');
            }
            if (izinTuru.Ek === true && izinTuru.EkAdi && izinTuru.EkAdi.length > 0) {
                if (itemValue.EkDosyaSil === true) {
                    if (!file) {
                        throw new BadRequestException('Ek gereklidir');
                    }
                }
            }
        } else {
            throw new BadRequestException('İzin Türü gereklidir');
        }
        const ekDosya = file?.path ?? null;
        try {
            const result = await this.izinTalepService.update(req.user.userId, { itemValue, checkedItems, gunlerChecked }, ekDosya);
            return result;
        } catch (error) {
            // Hata durumunda da dosyayı sil
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('izin-talepleri-delete')
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.izinTalepService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('izin-talepleri-delete')
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.izinTalepService.reload(req.user.userId, data);
    }
}
