import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { SohbetlerService } from './sohbetler.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('sohbetler')
export class SohbetlerController {
    constructor(
        private readonly sohbetlerService: SohbetlerService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('son-sohbetler')
    async getSonSohbetler(
        @Request() req,
        @Query() query: any
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sohbetlerService.getSonSohbetler(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('sohbet-kisileri')
    async getSohbetKisileri(
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sohbetlerService.getSohbetKisileri(req.user.userId);
    }


    @UseGuards(JwtAuthGuard)
    @Get('sohbet-item/:sohbetId')
    async getSohbetItem(@Request() req, @Param('sohbetId') sohbetId: number, @Query() query: any) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!sohbetId || sohbetId === 0) {
            throw new BadRequestException('Sohbet ID gereklidir');
        }
        return this.sohbetlerService.getSohbetItem(req.user.userId, sohbetId, query);
    }


    @UseGuards(JwtAuthGuard)
    @Post('sohbet-item')
    async postSohbetItem(@Request() req, @Body() data: number[]) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.sohbetlerService.postSohbetItem(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('yeni-mesaj')
    @UseInterceptors(FileInterceptor('...'))
    async postYeniMesaj(@Request() req, @Body() data: any) {
        const mesaj: string = data.mesaj ?? null;
        const kullanicilar = JSON.parse(data.kullanicilar || "[]");
        const UstMesajID: number = data.UstMesajID ?? null;
        const GrupAdi: string = data.GrupAdi ?? null;
        const TeknokentIDler = JSON.parse(data.TeknokentIDler || "[]");
        const FirmaIDler = JSON.parse(data.FirmaIDler || "[]");
        const SohbetID: number = data.SohbetID ?? null;
        const dosyalar = JSON.parse(data.dosyalar || "[]");

        if (dosyalar.length < 1 && (!mesaj || mesaj.length < 1)) {
            throw new BadRequestException('Mesaj içeriği boş olamaz.');
        }

        return this.sohbetlerService.postYeniMesaj(
            req.user.userId,
            mesaj,
            kullanicilar,
            UstMesajID,
            GrupAdi,
            TeknokentIDler,
            FirmaIDler,
            SohbetID,
            dosyalar
        );
    }



    @UseGuards(JwtAuthGuard)
    @SkipThrottle()
    @Post('yukle-dosya')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 1024 * 1024 * 25, // 25MB maksimum boyut
        },
        storage: diskStorage({
            destination: (req, file, cb) => {
                const isImage = file.mimetype.startsWith('image/');
                const uploadPath = isImage ? `./public/uploads/sohbetler/resimler` : `./uploads/sohbetler/dosyalar`;

                ['uploads', 'uploads/sohbetler', 'public/uploads/sohbetler/resimler', 'uploads/sohbetler/dosyalar']
                    .forEach(dir => {
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                    });

                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            const allowedMimeTypes = [
                // Resimler
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                // Dokümanlar
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                // Sıkıştırılmış dosyalar
                'application/zip',
                'application/x-zip-compressed',
                'application/x-rar-compressed',
                'application/x-7z-compressed',
                'application/vnd.rar'
            ];

            // Dosya boyutu kontrolü (25MB)
            const maxSize = 25 * 1024 * 1024; // 25MB
            if (parseInt(req.headers['content-length']) > maxSize) {
                cb(new BadRequestException('Dosya boyutu 25MB\'dan büyük olamaz.'), false);
                return;
            }

            // Sıkıştırılmış dosyalar için özel boyut kontrolü (10MB)
            const compressedTypes = [
                'application/zip',
                'application/x-zip-compressed',
                'application/x-rar-compressed',
                'application/x-7z-compressed',
                'application/vnd.rar'
            ];
            if (compressedTypes.includes(file.mimetype) && parseInt(req.headers['content-length']) > 10 * 1024 * 1024) {
                cb(new BadRequestException('Sıkıştırılmış dosyalar 10MB\'dan büyük olamaz.'), false);
                return;
            }

            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Geçersiz dosya tipi. Desteklenen formatlar: jpg, gif, jpeg, png, txt, pdf, doc, docx, xls, xlsx, zip, rar, 7z'), false);
            }
        }
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Request() req
    ) {
        try {
            if (!file) {
                throw new BadRequestException('Dosya yüklenemedi');
            }

            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }

            const isImage = file.mimetype.startsWith('image/');
            const fullPath = path.normalize(file.path).replace(/\\/g, '/');

            let dosyaYolu = isImage
                ? fullPath.replace(/^.*?(public\/|uploads\/)/, '')
                : fullPath.split(process.cwd().replace(/\\/g, '/')).pop();
            // Dosya bilgilerini hazırla
            const dosyaBilgisi = {
                DosyaAdi: file.originalname,
                DosyaYolu: dosyaYolu,
                DosyaBoyutu: file.size,
                DosyaTipi: file.mimetype,
                YukleyenKullaniciID: req.user.userId,
                MesajID: null, // Boş bırakılıyor
                YuklemeTarihi: new Date()
            };

            // Dosya bilgilerini veritabanına kaydet
            const kaydedilenDosya = await this.sohbetlerService.saveDosya(dosyaBilgisi);

            return kaydedilenDosya;

        } catch (error) {
            // Hata durumunda dosyayı temizle
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw new BadRequestException(error.message || 'Dosya yükleme hatası');
        }
    }


    @UseGuards(JwtAuthGuard)
    @Get('get-file')
    async getFile(
        @Query() query: any,
        @Request() req,
        @Res() res
    ) {
        try {
            // Kullanıcı kontrolü
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            const dosyaYolu = query.dosyaYolu;
            if (!dosyaYolu) {
                throw new BadRequestException('Dosya yolu gereklidir');
            }
            // Dosya bilgilerini al
            const dosya = await this.sohbetlerService.getDosyaBilgileri(dosyaYolu);
            if (!dosya) {
                throw new NotFoundException('Dosya bulunamadı');
            }

            // Kullanıcının bu dosyaya erişim yetkisi var mı kontrolü
            const hasAccess = await this.sohbetlerService.checkFileAccess(
                req.user.userId,
                dosya.SohbetID
            );
            if (!hasAccess) {
                throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok');
            }

            // Dosya yolunu oluştur
            const filePath = this.getFilePath(dosya);

            // Stream ile dosyayı gönder
            await this.streamFile(res, filePath, dosya, req);

        } catch (error) {
            console.error('Dosya erişim hatası:', error);
            throw new BadRequestException(
                error.message || 'Dosya görüntüleme hatası'
            );
        }
    }

    private getFilePath(dosya: any): string {
        const basePath = process.cwd();
        const filePath = path.join(basePath, dosya.DosyaURL);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Dosya sistemde bulunamadı');
        }

        return filePath;
    }

    private async streamFile(res: Response, filePath: string, dosya: any, req: any): Promise<void> {
        const stat = fs.statSync(filePath);
        const isImage = dosya.DosyaTipi.startsWith('image/');

        // Header'ları ayarla
        res.set({
            'Content-Type': dosya.DosyaTipi,
            'Content-Length': stat.size,
            'Content-Disposition': isImage
                ? 'inline'
                : `attachment; filename="${encodeURIComponent(path.basename(dosya.DosyaURL))}"`,
            'Cache-Control': 'public, max-age=3600', // 1 saat cache
            'Last-Modified': stat.mtime.toUTCString()
        });

        // Range request desteği için
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

            res.status(206);
            res.set({
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Content-Length': end - start + 1,
                'Accept-Ranges': 'bytes'
            });

            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
        } else {
            // Normal stream
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('sil-dosya')
    async sil(@Request() req, @Body() data: any) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data.DosyaID || data.DosyaID === 0) {
            throw new BadRequestException('Dosya ID gereklidir');
        }
        return this.sohbetlerService.dosyaSil(req.user.userId, data.DosyaID, data.SohbetID ?? null);
    }

    @UseGuards(JwtAuthGuard)
    @Post('sil-mesaj')
    async silMesaj(@Request() req, @Body() data: any) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data.MesajID || data.MesajID === 0) {
            throw new BadRequestException('Mesaj ID gereklidir');
        }
        return this.sohbetlerService.silMesaj(req.user.userId, data.MesajID, data.SohbetID);
    }

    @UseGuards(JwtAuthGuard)
    @Post('gruptan-ayril')
    async gruptanAyril(@Request() req, @Body() data: any) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data.sohbetID || data.sohbetID === 0) {
            throw new BadRequestException('Sohbet ID gereklidir');
        }
        return this.sohbetlerService.gruptanAyril(req.user.userId, data.sohbetID);
    }



}
