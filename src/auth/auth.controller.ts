import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  Req,
  BadRequestException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request as ExpressRequest } from 'express';
import * as parser from 'user-agent-parser';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import * as multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

interface Request extends ExpressRequest {
  ip: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {

    if (!request) {
      throw new BadRequestException('Bilinmeyen işletim sistemi');
    }

    try {
      const forwardedFor = request.headers['x-forwarded-for'];
      const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor || request.ip;

      const finalIpAddress = ipAddress || '2001:0db8:85a3:0000:0000:8a2e:0370:7334';


      const userAgentString = request.headers['user-agent'];

      const getDeviceInfo = (userAgentString: string): string => {
        try {
          const userAgentParser = parser(userAgentString);
          const browserName = userAgentParser.browser.name || 'Bilinmeyen tarayıcı';
          const osName = userAgentParser.os.name || 'Bilinmeyen işletim sistemi';

          return `${browserName} on ${osName}`;
        } catch (error) {
          return 'Cihaz bilgileri alınamadı';
        }
      };

      const deviceInfo = getDeviceInfo(userAgentString);
      const user = await this.authService.login(loginDto, finalIpAddress, deviceInfo);
      return { message: 'Oturum açma işlemi başarılı', user };
    } catch (error) {
      throw error
    }
  }

  private detectPlatform(userAgent: string): 'android' | 'ios' | 'web' | 'unknown' {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();

    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'ios';
    if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'web';

    return 'unknown';
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async logout(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }

    const userAgent = req.headers['user-agent'];
    const platform = this.detectPlatform(userAgent);

    console.log('Platform:', platform); // 'android', 'ios', 'web'

    return this.authService.logout(req.user.userId, platform === 'unknown' ? 'web' : platform);
  }

  @Throttle({ default: { limit: 16, ttl: 3600000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    try {
      const forwardedFor = request.headers['x-forwarded-for'];
      const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor || request.ip;

      const finalIpAddress = ipAddress || '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const userAgentString = request.headers['user-agent'];

      const getDeviceInfo = (userAgentString: string): string => {
        try {
          const userAgentParser = parser(userAgentString);
          const browserName = userAgentParser.browser.name || 'Bilinmeyen tarayıcı';
          const osName = userAgentParser.os.name || 'Bilinmeyen işletim sistemi';

          return `${browserName} on ${osName}`;
        } catch (error) {
          return 'Cihaz bilgileri alınamadı';
        }
      };
      const deviceInfo = getDeviceInfo(userAgentString);
      const user = await this.authService.register(registerDto, finalIpAddress, deviceInfo);
      return { message: 'Kayıt işlemi başarılı', user };
    } catch (error) {
      console.log(error)
      return error
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getCurrentUser(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }
    return this.authService.getCurrentUser(req.user.userId);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Throttle({ default: { limit: 6, ttl: 3600000 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Throttle({ default: { limit: 6, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  async updatePassword(@Body() updatePasswordDto: ChangePasswordDto, @Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }

    if (!req.user.userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.authService.updatePassword(updatePasswordDto, Number(req.user.userId));
  }

  @Throttle({ default: { limit: 6, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard)
  @Post('email-update')
  async updateEmail(@Body() data: { email: string }, @Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }

    if (!req.user.userId) {
      throw new BadRequestException('User ID zorunludur');
    }
    if (!data.email) {
      throw new BadRequestException('E-posta adresi zorunludur');
    }
    return this.authService.updateEmail(Number(req.user.userId), data.email);
  }


  @Throttle({ default: { limit: 6, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard)
  @Post('user-info-update')
  async updateUserInfo(@Body() data: any, @Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }
    return this.authService.updateUserInfo(data?.fullName, data?.phoneNumber, Number(req.user.userId));
  }


  @Post('user-avatar-update')
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
  async updateUserAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }

    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi');
    }

    try {
      if (!file) throw new BadRequestException('Resim dosyası gerekli');

      //const isProduction = process.env.NODE_ENV === 'production';

      const baseDir = path.join(process.cwd(), 'public', 'uploads', 'profile-images');

      // klasörü oluştur
      fs.mkdirSync(baseDir, { recursive: true });

      const filename = `${Date.now()}-${uuidv4()}.jpeg`;
      const outputPath = path.join(baseDir, filename);

      // resmi işleyip kaydet
      await sharp(file.buffer)
        .resize(164, 164)
        .jpeg({ quality: 100 })
        .toFile(outputPath);

      const publicPath = `/uploads/profile-images/${filename}`;
      return this.authService.updateUserAvatar(publicPath, Number(req.user.userId));
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Dosya yükleme sırasında bir hata oluştu'
      );
    }
  }

  @Throttle({ default: { limit: 6, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard)
  @Post('delete-avatar')
  async avatarDelete(@Request() req,) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }

    return this.authService.avatarDelete(Number(req.user.userId));
  }


  @Throttle({ default: { limit: 6, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard)
  @Post('account-delete')
  async accountDelete(@Request() req,) {
    if (!req.user) {
      throw new UnauthorizedException('Kullanıcı Kimliği gereklidir');
    }

    return this.authService.accountDelete(Number(req.user.userId));
  }




  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('verify-email')
  async verifyEmail(
    @Body('token') token: string,
    @Body('password') password: string,
    @Req() request: Request,
  ) {
    if (!token || !password) {
      throw new BadRequestException('Geçersiz token');
    }
    const forwardedFor = request.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor || request.ip;

    const finalIpAddress = ipAddress || '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const userAgentString = request.headers['user-agent'];

    const getDeviceInfo = (userAgentString: string): string => {
      try {
        const userAgentParser = parser(userAgentString);
        const browserName = userAgentParser.browser.name || 'Bilinmeyen tarayıcı';
        const osName = userAgentParser.os.name || 'Bilinmeyen işletim sistemi';

        return `${browserName} on ${osName}`;
      } catch (error) {
        return 'Cihaz bilgileri alınamadı';
      }
    };
    const deviceInfo = getDeviceInfo(userAgentString);

    return await this.authService.verifyEmailToken(
      token,
      password,
      finalIpAddress,
      deviceInfo,
    );
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('verify-resend-email')
  async verifyResendEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('E-posta adresi zorunludur');
    }
    const user = await this.authService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('E-posta adresine kayıtlı kullanıcı bulunamadı');
    }

    return await this.authService.verifyResendEmail(email);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('two-factor-resend')
  async twoFactorResend(
    @Body('payload') payload: string,
    @Body('email') email: string
  ) {
    if (!payload || !email) {
      throw new BadRequestException('E-posta adresi ve token gereklidir');
    }
    const user = await this.authService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('E-posta adresine kayıtlı kullanıcı bulunamadı');
    }

    return await this.authService.twoFactorResend(email);
  }

  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('two-factor-login')
  async twoFactorLogin(
    @Body('code') code: string,
    @Body('email') email: string
  ) {
    if (!code || !email) {
      throw new BadRequestException(
        'Doğrulama kodu ve e-posta adresi gereklidir',
      );
    }

    const user = await this.authService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('E-posta adresine kayıtlı kullanıcı bulunamadı');
    }

    return await this.authService.twoFactorLogin(code, email);
  }
}
