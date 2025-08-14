import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FirmalarService } from './firmalar.service';
import { CreateFirmaDto } from './dto/create.dto';
import { UpdateFirmaDto } from './dto/update.dto';
import { YetkiUserRoles } from 'src/auth/roles.decorator';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import * as multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Throttle } from '@nestjs/throttler';

@Controller('firmalar')
export class FirmalarController {
    constructor(
        private readonly firmalarService: FirmalarService,
    ) { }


    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-seeing')
    @Get('tekno-firma-detay/:itemId/:iliskiId?')
    async getTeknoFirmaDetay(
        @Request() req,
        @Param('itemId') itemId: number,
        @Param('iliskiId') IliskiID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }
        if (!itemId) {
            throw new BadRequestException('Firma ID zorunludur');
        }
        return this.firmalarService.getTeknoFirmaDetay(req.user.userId, itemId, IliskiID ?? null);

    }

    @UseGuards(JwtAuthGuard)
    @Get('get-firma/:firmaId')
    async getFirma(
        @Request() req,
        @Param('firmaId') FirmaID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        return this.firmalarService.getFirma(req.user.userId, FirmaID);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-firma-kullanicilari/:firmaId')
    async getFirmaKullanicilari(
        @Request() req,
        @Param('firmaId') FirmaID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        return this.firmalarService.getFirmaKullanicilari(req.user.userId, FirmaID);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-firmalar')
    async getActiveFirmalar(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmalarService.getActiveFirmalar(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('teknokent-active-firmalar/:teknokentId')
    async teknokentActiveFirmalar(
        @Request() req,
        @Param('teknokentId') TeknokentID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!TeknokentID) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        return this.firmalarService.teknokentActiveFirmalar(req.user.userId, TeknokentID);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-firmalar')
    async getFirmalar(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmalarService.getFirmalar(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-firma-subeleri/:bilgiId')
    async getFirmaSubeleri(
        @Request() req,
        @Query() query: any,
        @Param('bilgiId') BilgiID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmalarService.getFirmaSubeleri(req.user.userId, BilgiID, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmalarService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.firmalarService.reload(req.user.userId, data);
    }




    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('image', {
        storage: multer.memoryStorage(),
        limits: { fileSize: 1024 * 1024 * 10 },
        fileFilter: (req, file, cb) => {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Sadece jpg, jpeg, png formatları desteklenir'), false);
            }
        }
    }))
    async upload(@Body() body: any,
        @Request() req,
        @UploadedFile() file: Express.Multer.File
    ) {
        let publicPath = null;
        const data: UpdateFirmaDto = body.firmaValues ? JSON.parse(body.firmaValues) : null;
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data) {
            throw new BadRequestException('Zorunlu bilgileri doldurun');
        }

        try {
            if (file) {
                const baseDir = path.join(process.cwd(), 'public', 'uploads', 'firma-logoes');

                // klasörü oluştur
                fs.mkdirSync(baseDir, { recursive: true });

                const filename = `${Date.now()}-${uuidv4()}.jpeg`;
                const outputPath = path.join(baseDir, filename);

                // resmi işleyip kaydet
                await sharp(file.buffer)
                    .jpeg({ quality: 100 })
                    .toFile(outputPath);

                publicPath = `/uploads/firma-logoes/${filename}`;
            }

            return this.firmalarService.upload(req.user.userId, data, publicPath);
        } catch (error) {
            const fullPath = path.join(process.cwd(), 'public', publicPath);
            try {
                if (fs.existsSync(fullPath)) {
                    await fs.promises.unlink(fullPath);
                }
            } catch (err) {
                console.error('Dosya silme hatası:', err);
            }


            throw new BadRequestException(
                error.message || 'Dosya yükleme sırasında bir hata oluştu'
            );
        }



    }

    @UseGuards(JwtAuthGuard)
    @Post('sube-upload')
    async subeUpload(
        @Body() body: { BilgiID: number, SubeAdi: string, Il: string, Ilce: string, Ulke: string, Adres: string, Telefon: string, Email: string, AnaSubemi: boolean },
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!body || !body.SubeAdi || !body.Il || !body.Ilce || !body.BilgiID || !body.Telefon || !body.Adres || !body.Email) {
            throw new BadRequestException('Zorunlu bilgileri doldurun');
        }

        return this.firmalarService.subeUpload(req.user.userId, body);
    }

    @Post('logo-update')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image', {
        storage: multer.memoryStorage(),
        limits: { fileSize: 1024 * 1024 * 10 },
        fileFilter: (req, file, cb) => {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Sadece jpg, jpeg, png formatları desteklenir'), false);
            }
        }
    }))
    async updateFirmaLogo(
        @Request() req,
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!req.user.userId) {
            throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
        }

        if (!file) {
            throw new BadRequestException('Dosya yüklenemedi');
        }

        if (!body || !body.FirmaID) {
            throw new BadRequestException('Zorunlu bilgileri doldurun');
        }

        const firmaId = JSON.parse(body.FirmaID);

        if (!firmaId) {
            throw new BadRequestException('Zorunlu bilgileri doldurun');
        }

        try {
            if (!file) throw new BadRequestException('Resim dosyası gerekli');

            //const isProduction = process.env.NODE_ENV === 'production';

            const baseDir = path.join(process.cwd(), 'public', 'uploads', 'firma-logoes');

            // klasörü oluştur
            fs.mkdirSync(baseDir, { recursive: true });

            const filename = `${Date.now()}-${uuidv4()}.jpeg`;
            const outputPath = path.join(baseDir, filename);

            // resmi işleyip kaydet
            await sharp(file.buffer)
                .jpeg({ quality: 100 })
                .toFile(outputPath);

            const publicPath = `/uploads/firma-logoes/${filename}`;
            return this.firmalarService.updateFirmaLogo(publicPath, Number(firmaId));
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Dosya yükleme sırasında bir hata oluştu'
            );
        }
    }

    @Throttle({ default: { limit: 6, ttl: 3600000 } })
    @UseGuards(JwtAuthGuard)
    @Post('delete-logo')
    async logoDelete(@Request() req, @Body() data: { FirmaID: number }) {
        if (!req.user.userId) {
            throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        return this.firmalarService.logoDelete(Number(data.FirmaID));
    }


    @Throttle({ default: { limit: 6, ttl: 3600000 } })
    @UseGuards(JwtAuthGuard)
    @Post('sube-delete')
    async subeDelete(@Request() req, @Body() data: { SubeID: number }) {
        if (!req.user.userId) {
            throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.SubeID) {
            throw new BadRequestException('Sube ID gereklidir');
        }

        return this.firmalarService.subeDelete(req.user.userId, data);
    }

}
