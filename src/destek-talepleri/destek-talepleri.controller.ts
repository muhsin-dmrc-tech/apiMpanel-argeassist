import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { DestekTalepleriService } from './destek-talepleri.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CreateDestekTalepDto } from './dto/create.dto';

@Controller('destek-talepleri')
export class DestekTalepleriController {
    constructor(
        private readonly destekTalepService: DestekTalepleriService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-destek-talepleri')
    async getTalepler(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.destekTalepService.getTalepler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('talepler/:departman/:id?')
    async getYonetimTalepler(
        @Request() req,
        @Param('departman') departman: string,
        @Param('id') teknokentID: number,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!departman) {
            throw new BadRequestException('Departman gereklidir');
        }

        if (departman === 'teknokent') {
            if (!teknokentID) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }
        }

        return this.destekTalepService.getYonetimTalepler(req.user.userId, query,departman, teknokentID);
    }


    @UseGuards(JwtAuthGuard)
    @Get('get-destek-talebi-item/:id')
    async getTalep(
        @Request() req,
        @Param('id') DestekTalepID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!DestekTalepID) {
            throw new BadRequestException('Destek Talep ID gereklidir');
        }

        return this.destekTalepService.getTalep(req.user.userId, DestekTalepID);
    }





    @Post('create')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files', 3, {
        storage: diskStorage({
            destination: './uploads/destek-talepleri',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            const allowedMimeTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'application/pdf',
                'text/plain'
            ];

            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Geçersiz dosya tipi. Sadece .jpg, .gif, .jpeg, .png, .txt ve .pdf dosyaları kabul edilir.'), false);
            }
        }
    }))
    async create(
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() formData: CreateDestekTalepDto,
        @Request() req
    ) {
        try {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }

            const filePaths = files?.map(file => file.path) || [];

            const result = await this.destekTalepService.create(
                req.user.userId,
                {
                    ...formData,
                    DestekTipiID: parseInt(formData.DestekTipiID),
                    ProjeID: formData.ProjeID ? parseInt(formData.ProjeID) : null,
                },
                filePaths
            );
            return result;

        } catch (error) {
            // Hata durumunda yüklenen dosyaları temizle
            if (files && files.length > 0) {
                files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            throw error;
        }
    }


    @UseGuards(JwtAuthGuard)
    @Post('get-file')
    async getFile(
        @Body() data: { file: string; destekTalepId: number },
        @Request() req,
        @Res() res
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data.file || !data.destekTalepId) {
            throw new BadRequestException('Dosya yolu ve destek talep ID gereklidir');
        }

        try {
            const result = await this.destekTalepService.getFile(data.file, data.destekTalepId);

            res.set({
                'Content-Type': result.data.mimeType,
                'Content-Disposition': `inline; filename=${result.data.fileName}`,
            });

            // Base64'den buffer'a çevir ve gönder
            const buffer = Buffer.from(result.data.content, 'base64');
            res.send(buffer);
        } catch (error) {
            throw error;
        }
    }
}
