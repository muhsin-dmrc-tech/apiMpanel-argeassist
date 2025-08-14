import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Get, Request, Query, Param, BadRequestException, Res, ForbiddenException } from '@nestjs/common';
import { ProjeRaporlariService } from './proje-raporlari.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { CreateProjeRaporDto, PersonelTableData } from './dto/create.dto';
import { DataSource } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';


@Controller('proje-raporlari')
export class ProjeRaporlariController {
    constructor(
        private readonly projeRaporService: ProjeRaporlariService,
        private readonly dataSource: DataSource,
    ) { }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-seeing')
    @Get('tekno-aylik-faaliyet-raporlari/:teknokentId')
    async aylikFaaliyetRaporlariTekno(
        @Request() req,
        @Query() query: any,
        @Param('teknokentId') TeknokentID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeRaporService.aylikFaaliyetRaporlariTekno(req.user.userId, query, TeknokentID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-seeing')
    @Get('/tekno-uzman-hakem-projeler/:teknokentId/:ilgiliId')
    async teknoUzmanVeHakemProjeler(
        @Request() req,
        @Param('teknokentId') TeknokentID: number,
        @Param('ilgiliId') IlgiliID: number
    ) {

        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!TeknokentID) {
            throw new BadRequestException(`Teknokent ID gereklidir`);
        }
        if (!IlgiliID) {
            throw new BadRequestException(`Uzman yada hakem id gereklidir`);
        }

        return this.projeRaporService.teknoUzmanVeHakemProjeler(req.user.userId, TeknokentID, IlgiliID);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-seeing')
    @Get('aylik-faaliyet-raporlari/:firmaId')
    async aylikFaaliyetRaporlari(
        @Request() req,
        @Query() query: any,
        @Param('firmaId') firmaId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeRaporService.aylikFaaliyetRaporlari(req.user.userId, query, firmaId);
    }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-seeing')
    @Get('get-raporlar-teknoadmin/:iliskiId?')
    async getRaporlarTeknoAdmin(
        @Request() req,
        @Query() query: any,
        @Param('iliskiId') IliskiID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        return this.projeRaporService.getRaporlarTeknoAdmin(req.user.userId, query, IliskiID);

    }



    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-seeing')
    @Get('secili-proje-raporlari/:projeId/:iliskiId?')
    async getSeciliProjeRaporlari(
        @Request() req,
        @Param('projeId') projeId: number,
        @Param('iliskiId') IliskiID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!projeId) {
            throw new BadRequestException('Proje ID zorunludur');
        }
        return this.projeRaporService.getSeciliProjeRaporlari(req.user.userId, projeId, IliskiID ?? null);

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
        const ProjeID = query.projeId ?? '';
        const DonemID = query.donemId ?? '';
        const RaporID = query.raporId ?? '';

        if (!RaporID && (!ProjeID || !DonemID)) {
            throw new BadRequestException('Proje ID ve Donem ID yada Rapor ID gereklidir');
        }

        if (!RaporID && !ProjeID && !DonemID) {
            throw new BadRequestException('Proje ID ve Donem ID yada Rapor ID gereklidir');
        }



        return this.projeRaporService.getRaporItem(req.user.userId, ProjeID, DonemID, RaporID);
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
            throw new BadRequestException('Rapor ID ve sürec adı gereklidir');
        }

        if ((Surec === 'onOnay' || Surec === 'hakemOnay') && (Zaman === 'ay' || Zaman === 'yil')) {
            return this.projeRaporService.getSurecKayitlari(req.user.userId, RaporID, Surec, Zaman);
        } else {
            throw new BadRequestException('Sürec ve zaman doğru girilmemiş.');
        }


    }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-edit')
    @Post('/upload/:firmaId')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = './uploads/proje-raporlari';
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const projeId = Math.floor(Math.random() * 1000000);
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

                    // Dosya adını oluştur: proje-donem-sira-tarih-uniqueId-orijinalAd.pdf
                    const fileName = `proje${projeId}-donem${donemId}-rapor${siraNo}-${dateStr}-${uniqueId}-${cleanFileName}.pdf`;

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
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() formData: any,
        @Request() req
    ) {

        try {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            if (!formData.itemValue) {
                throw new BadRequestException('Proje, firma veya dönem bilgileri eksik veya boş');
            }
            const itemValue: CreateProjeRaporDto = JSON.parse(formData.itemValue);
            const personelList: PersonelTableData[] = formData.personelList ? JSON.parse(formData.personelList) : [];
            const isOrtagiList: any = formData.isOrtagiList ? JSON.parse(formData.isOrtagiList) : [];


            // personelList kontrolü
            if ((itemValue.SiraNo === 6 ? itemValue.adim !== 'c' : !itemValue.BelgesizIslem) && (!personelList.length || personelList?.length < 1)) {
                throw new BadRequestException('Personel listesi boş olamaz');
            }

            if (itemValue.SiraNo > 2 && itemValue.RaporID < 1) {
                throw new BadRequestException('Geçersiz rapor id');
            }
            // Verileri kontrol et
            if (isNaN(itemValue.DonemID) || isNaN(itemValue.ProjeID) || isNaN(itemValue.SiraNo)) {
                throw new BadRequestException('Geçersiz sayısal değerler');
            }
            if (!Number.isInteger(itemValue.DonemID) || !Number.isInteger(itemValue.ProjeID) || !Number.isInteger(itemValue.SiraNo)) {
                throw new BadRequestException('Geçersiz sayısal değerler');
            }
            if (itemValue.RaporID && !Number.isInteger(itemValue.RaporID)) {
                throw new BadRequestException('Geçersiz sayısal değerler');
            }
            const result = await this.projeRaporService.upload(
                req.user.userId,
                itemValue,
                personelList ?? null,
                file ? file.path : null,
                isOrtagiList

            );

            return result;

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
        if (user.KullaniciTipi !== 3) {
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

        return await this.projeRaporService.onayUpload(req.user.userId, formData)

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
            const result = await this.projeRaporService.getFile(file);

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
    @Get('get-file-mobil')
    async getFileMobil(
        @Query() query: any,
        @Request() req,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        const file = query.file ?? null;
        const raporID = query.raporId ?? null;
        if (!file || !raporID) {
            throw new BadRequestException('Dosya yolu gereklidir');
        }

        try {
           return await this.projeRaporService.getFileMobil(req.user.userId,raporID,file)

        } catch (error) {
            console.error('getFile error:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Dosya işlenemedi');
        }
    }





    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-rapor-edit')
    @Post('/upload-api/:firmaId')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = './uploads/proje-raporlari';
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const projeId = Math.floor(Math.random() * 1000000);
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

                    // Dosya adını oluştur: proje-donem-sira-tarih-uniqueId-orijinalAd.pdf
                    const fileName = `proje${projeId}-donem${donemId}-rapor${siraNo}-${dateStr}-${uniqueId}-${cleanFileName}.pdf`;

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
        @Param('firmaId') firmaId: string
    ) {

        try {
            if (!req.user.userId) {
                throw new BadRequestException('Kullanıcı ID gereklidir');
            }
            if (!firmaId) {
                throw new BadRequestException('Firma ID gereklidir');
            }
            if (!formData.itemValue) {
                throw new BadRequestException('Proje, firma veya dönem bilgileri eksik veya boş');
            }
            const itemValue: CreateProjeRaporDto = JSON.parse(formData.itemValue);
            const isOrtagiList: any = formData.isOrtagiList ? JSON.parse(formData.isOrtagiList) : [];
            const response = await this.projeRaporService.newupload(req.user.userId, itemValue, Number(firmaId), file ? file.path : null,isOrtagiList ?? null)

            if ('error' in response || ('personelListesi' in response && 'farklilar' in response.personelListesi && response.personelListesi.farklilar.length > 0)) {
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

}
