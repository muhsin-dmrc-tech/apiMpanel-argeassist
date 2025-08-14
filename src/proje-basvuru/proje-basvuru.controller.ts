import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProjeBasvuruService } from './proje-basvuru.service';
import { CreateBasvuruDto } from './dto/create.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UpdateBasvuruDto } from './dto/update.dto';
import { Response } from 'express';
import * as mime from 'mime-types';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('proje-basvuru')
export class ProjeBasvuruController {
    constructor(
        private readonly basvuruService: ProjeBasvuruService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-proje-basvuru-item/:id')
    async getBasvuru(
        @Request() req,
        @Param('id') BasvuruID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!BasvuruID) {
            throw new BadRequestException('Basvuru ID gereklidir');
        }

        return await this.basvuruService.getBasvuru(req.user.userId, BasvuruID);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-proje-basvuru-file/:id')
    async getImportFile(
        @Request() req,
        @Param('id') BasvuruID: number,
        @Res() res: Response
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!BasvuruID) {
            throw new BadRequestException('Basvuru ID gereklidir');
        }

        try {
            const result = await this.basvuruService.getImportFile(req.user.userId, BasvuruID);
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

    @UseGuards(JwtAuthGuard)
    @Get('get-proje-basvurulari')
    async getBasvurular(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.getBasvurular(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('destek-proje-basvurulari')
    async getDestekBasvurular(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.getDestekBasvurular(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('proje-basvurulari-admin')
    async getBasvurularAdmin(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.getBasvurularAdmin(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(3)
    @Get('proje-basvurulari-teknoadmin')
    async getBasvurularTeknoAdmin(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.getBasvurularTeknoAdmin(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post('create')
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
        const itemValue: CreateBasvuruDto = JSON.parse(rawData.itemValue);
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        const ekDosya = file?.path ?? null;
        try {
            const result = this.basvuruService.create(req.user.userId, itemValue, ekDosya);
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




    @UseGuards(JwtAuthGuard)
    @Post('update')
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
        const itemValue: UpdateBasvuruDto = JSON.parse(rawData.itemValue);
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (itemValue.EkDosyaSil === true) {
            if (!file) {
                throw new BadRequestException('Ek gereklidir');
            }
        }
        const ekDosya = file?.path ?? null;
        try {
            const result = await this.basvuruService.update(req.user.userId, itemValue, ekDosya);
            return result;
        } catch (error) {
            // Hata durumunda da dosyayı sil
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.reload(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('degerlendir')
    async degerlendir(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.basvuruService.degerlendir(req.user.userId, data);
    }
}
