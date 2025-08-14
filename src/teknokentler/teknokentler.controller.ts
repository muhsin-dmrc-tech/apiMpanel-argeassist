import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles, YetkiUserRoles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { TeknokentlerService } from './teknokentler.service';
import { YetkiRolesGuard } from 'src/auth/firmauser.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import * as multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Throttle } from '@nestjs/throttler';
import { UpdateDto } from './dto/update.dto';

@Controller('teknokentler')
export class TeknokentlerController {
    constructor(
        private readonly teknokentService: TeknokentlerService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('get-users')
    async getKullanicilar(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.getKullanicilar();
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-active-teknokentler')
    async getActiveTeknokentler(
        @Request() req
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.getActiveTeknokentler();
    }

    @UseGuards(JwtAuthGuard)
    @Get('teknokent-dashboard/:teknokentId')
    async teknokentDashboard(
        @Request() req,
        @Param('teknokentId') teknokentId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.teknokentDashboard(teknokentId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('teknokent-dashboard-uzmanlar/:teknokentId')
    async teknokentDashboardUzmanlar(
        @Request() req,
        @Param('teknokentId') teknokentId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.teknokentDashboardUzmanlar(teknokentId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(3, 2)
    @Get('get-uzman-yonetimi/:teknokentId')
    async getUzmanYonetimi(
        @Request() req,
        @Param('teknokentId') teknokentId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!teknokentId && teknokentId < 1) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        return this.teknokentService.getUzmanYonetimi(teknokentId);
    }



    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(3, 2)
    @Get('get-uzmanlar/:id')
    async getUzmanlar(
        @Request() req,
        @Query() query: any,
        @Param('id') teknokentId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!teknokentId && teknokentId < 1) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        return this.teknokentService.getUzmanlar(req.user.userId, query, teknokentId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(3, 2)
    @Get('get-hakemler/:id')
    async getHakemler(
        @Request() req,
        @Query() query: any,
        @Param('id') teknokentId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!teknokentId && teknokentId < 1) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        return this.teknokentService.getHakemler(req.user.userId, query, teknokentId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('proje-seeing')
    @Get('get-projeler/:iliskiId')
    async getProjeler(
        @Request() req,
        @Param('iliskiId') teknokentId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!teknokentId && teknokentId < 1) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        return this.teknokentService.getProjeler(req.user.userId, teknokentId);
    }

    @UseGuards(JwtAuthGuard, YetkiRolesGuard)
    @YetkiUserRoles('firma-seeing')
    @Get('get-firmalar/:iliskiId')
    async getFirmalar(
        @Request() req,
        @Query() query: any,
        @Param('iliskiId') iliskiId: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!iliskiId && iliskiId < 1) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        return this.teknokentService.getFirmalar(req.user.userId, query, iliskiId);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-teknokentler')
    async getTeknokentler(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.getTeknokentler(req.user.userId, query);
    }
    @UseGuards(JwtAuthGuard)
    @Get('get-teknokent-detay/:teknokentId')
    async getTeknokentDetay(
        @Request() req,
        @Param('teknokentId') TeknokentID: number,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.getTeknokentDetay(req.user.userId, TeknokentID);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.reload(req.user.userId, data);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: { TeknokentAdi: string, Sehir: string, Ilce: string, KullaniciID: number }, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.teknokentService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2, 3)
    @Post('update')
    async update(@Body() data: UpdateDto,
        @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        if (!data) {
            throw new BadRequestException('Zorunlu bilgileri doldurun');
        }

        return this.teknokentService.update(req.user.userId, data);
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
    async updateTeknokentLogo(
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

        if (!body || !body.TeknokentID) {
            throw new BadRequestException('Zorunlu bilgileri doldurun');
        }

        const TeknokentID = JSON.parse(body.TeknokentID);

        if (!TeknokentID) {
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
            return this.teknokentService.updateTeknokentLogo(publicPath, Number(TeknokentID));
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Dosya yükleme sırasında bir hata oluştu'
            );
        }
    }

    @Throttle({ default: { limit: 6, ttl: 3600000 } })
    @UseGuards(JwtAuthGuard)
    @Post('delete-logo')
    async logoDelete(@Request() req, @Body() data: { TeknokentID: number }) {
        if (!req.user.userId) {
            throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
        }
        if (!data.TeknokentID) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }

        return this.teknokentService.logoDelete(Number(data.TeknokentID));
    }
}
