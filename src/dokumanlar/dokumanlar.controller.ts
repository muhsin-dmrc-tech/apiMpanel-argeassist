import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Get, Request, Query, Param, BadRequestException, Res, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CreateProjeRaporDto } from './dto/create.dto';
import { DataSource } from 'typeorm';
import { DokumanlarService } from './dokumanlar.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';

@Controller('dokumanlar')
export class DokumanlarController {
    constructor(
        private readonly dokumanlarService: DokumanlarService,
        private readonly dataSource: DataSource,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('aylik-faaliyet-raporlari')
    async aylikFaaliyetRaporlari(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.dokumanlarService.aylikFaaliyetRaporlari(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin-aylik-faaliyet-raporlari')
    async aylikFaaliyetRaporlariAdmin(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.dokumanlarService.aylikFaaliyetRaporlariAdmin(req.user.userId, query);
    }



    @UseGuards(JwtAuthGuard)
    @Get('get-item')
    async getRaporItem(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        const DonemID = query.donemId ?? '';
        const ID = query.raporId ?? '';

        if (!ID && !DonemID) {
            throw new BadRequestException('Donem ID yada Dokuman ID gereklidir');
        }



        return this.dokumanlarService.getRaporItem(req.user.userId, ID, DonemID);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-file-analize')
    async getFileAnaliz(
        @Query() query: any,
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        const file = query.file ?? null;
        const ID = query.raporId ?? null;
        if (!file || !ID) {
            throw new BadRequestException('Dosya yolu gereklidir');
        }

        try {
            return await this.dokumanlarService.getFileApi(req.user.userId, ID, file)

        } catch (error) {
            console.error('getFile error:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Dosya işlenemedi');
        }
    }


    @UseGuards(JwtAuthGuard)
    @Get('get-file')
    async getFile(
        @Query() query: any,
        @Request() req,
        @Res() res
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        const file = query.file ?? null;
        if (!file) {
            throw new BadRequestException('Dosya yolu gereklidir');
        }

        try {
            const result = await this.dokumanlarService.getFile(file);

            // Normal dosya indirme
            res.set({
                'Content-Type': result.data.mimeType,
                'Content-Disposition': `inline; filename="${result.data.fileName}"`,
            });

            const buffer = Buffer.from(result.data.content, 'base64');
            res.send(buffer);

        } catch (error) {
            console.error('getFile error:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Dosya işlenemedi');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('surec-kayitlari')
    async getSurecKayitlari(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        const Surec = query.surec ?? '';
        const Zaman = query.zaman ?? '';
        const RaporID = query.raporId ?? '';

        if (!RaporID && !Surec) {
            throw new BadRequestException('Dokuman ID ve sürec adı gereklidir');
        }

        if (Surec === 'Onay' && (Zaman === 'ay' || Zaman === 'yil')) {
            return this.dokumanlarService.getSurecKayitlari(req.user.userId, RaporID, Surec, Zaman);
        } else {
            throw new BadRequestException('Sürec ve zaman doğru girilmemiş.');
        }


    }

    @UseGuards(JwtAuthGuard)
    @Post('/upload-api')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = './uploads/mp-dokumanlar';
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const kullaniciId = Math.floor(Math.random() * 1000000);
                    const donemId = new Date().getMonth();
                    const siraNo = Math.floor(Math.random() * 1000000);

                    // Tarihi formatla: YYYYMMDD
                    const dateStr = new Date().toISOString()
                        .slice(0, 10)
                        .replace(/-/g, '');

                    // Benzersiz son ek oluştur
                    const uniqueId = Math.random().toString(36).substring(2, 15);

                    // Dosya adını temizle
                    const cleanFileName = path.parse(file.originalname).name
                        .replace(/[^a-z0-9]/gi, '-')
                        .toLowerCase()
                        .substring(0, 30); // Max 30 karakter

                    // Dosya adını oluştur: kullanici-donem-sira-tarih-uniqueId-orijinalAd.pdf
                    const fileName = `kullanici${kullaniciId}-donem${donemId}-rapor${siraNo}-${dateStr}-${uniqueId}-${cleanFileName}.pdf`;

                    cb(null, fileName);
                }
            }),
            fileFilter: (req, file, cb) => {
                // PDF kontrolü
                if (file.mimetype !== 'application/pdf') {
                    return cb(
                        new BadRequestException('Sadece PDF dosyaları yüklenebilir'),
                        false
                    );
                }

                // Dosya boyutu kontrolü (10MB)
                if (parseInt(req.headers['content-length']) > 10 * 1024 * 1024) {
                    return cb(
                        new BadRequestException('Dosya boyutu 10MB\'dan büyük olamaz'),
                        false
                    );
                }

                cb(null, true);
            },
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB
            }
        })
    )
    async newupload(
        @UploadedFile() file: Express.Multer.File,
        @Body() formData: any,
        @Request() req,
    ) {

        try {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }

            if (!formData.itemValue) {
                throw new BadRequestException('Firma veya dönem bilgileri eksik veya boş');
            }
            const itemValue: CreateProjeRaporDto = JSON.parse(formData.itemValue);
            const isOrtagiList: any = formData.isOrtagiList ? JSON.parse(formData.isOrtagiList) : [];
            const response = await this.dokumanlarService.newupload(req.user.userId, itemValue, file ? file.path : null, isOrtagiList ?? null)

            if ('error' in response) {
                if (file?.path && fs.existsSync(file.path)) {
                    await fs.promises.unlink(file.path);
                }
            }

            return response


        } catch (error) {
            // Hata durumunda dosyayı sil
            if (file?.path && fs.existsSync(file.path)) {
                await fs.promises.unlink(file.path);
            }

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new BadRequestException(
                error.message || 'Dosya yükleme sırasında bir hata oluştu'
            );
        }
    }


    @UseGuards(JwtAuthGuard)
        @Post('/onay-uploads')
        async onayUploads(
            @Body() formData: { RaporID: number, durum: string, surecAnahtar: string, aciklama?: string },
            @Request() req
        ) {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı Kimliği gereklidir');
            }
    
            const user = await this.dataSource.getRepository(Kullanicilar).findOne({
                where: { id: req.user.userId },
            });
    
            if (!user) {
                throw new BadRequestException('Kullanıcı bulunamadı');
            }
            if (user.KullaniciTipi !== 2) {
                throw new ForbiddenException('Yetkisiz kullanıcı tipi');
            }
    
            if (!formData.RaporID || !formData.durum || !formData.surecAnahtar) {
                throw new BadRequestException('Rapor ID, Süreç anahatarı ve durum zorunludur.');
            }
            if (!Number.isInteger(formData.RaporID)) {
                throw new BadRequestException("Geçersiz Rapor ID");
            }
    
            if (formData.durum === 'reddedildi' && !formData.aciklama) {
                throw new BadRequestException('Açıklama alanı boş bırakılamaz');
            }
    
            return await this.dokumanlarService.onayUpload(req.user.userId, formData)
    
        }
}
