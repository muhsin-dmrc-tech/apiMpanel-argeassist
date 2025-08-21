import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DataSource } from 'typeorm';
import { LoginKayitlari } from 'src/login-kayitlari/entities/login-kayitlari.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { createHash } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { SmsService } from 'src/sms/sms.service';
import * as fs from 'fs';
import * as path from 'path';
import { KullaniciCihazlari } from 'src/kullanicilar/entities/kullanici-cihazlari.entity';
import { FirmaAbonelikleri } from 'src/firma-abonelikleri/entities/firma-abonelikleri.entity';
//import { LogsService } from 'src/logs-tables/logs.service';




/* 1️⃣ Yeni logLevel Mantığı

UnauthorizedException (Çok kritik) → error
ForbiddenException (Önemli) → error
BadRequestException (Daha az önemli) → warning
InternalServerErrorException ve diğer kritik hatalar → error */




@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    /*
    private readonly logsService: LogsService */
  ) { }

  async login(loginDto: LoginDto, ipAddress: string, deviceInfo: string) {
    const {
      email,
      password
    } = loginDto;

    // Kullanıcıyı e-posta ile bul
    const user = await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { Email: email },
      select: ['id', 'Email', 'Sifre', 'deletedAt', 'KullaniciTipi', 'AdSoyad', 'isVerified', 'isTwoFactorEnabled'], // Şifreyi buraya ekliyoruz
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    if (user.deletedAt) {
      throw new BadRequestException('Bu hesap silinmiş');
    }

    // Kullanıcı doğrulama durumu
    if (!user.isVerified) {
      try {
        await this.dataSource.getRepository(LoginKayitlari).save({
          Kullanici: user,
          GirisZamani: new Date(),
          IPAdresi: ipAddress,
          CihazBilgisi: deviceInfo,
          BasariliMi: false,
          HataNedeni: 'E-posta onaylanmamış',
        });
      } catch (error) {
        throw new Error(`Kullanıcı Oturum Açma sırsında hata oluştu: ${error.message}`);
      }
      return await this.handleEmailVerification(user);
    } else {
      const isPasswordValid = await bcrypt.compare(password, user.Sifre);
      if (!isPasswordValid) {
        throw new ForbiddenException('Geçersiz şifre');
      }
      try {
        await this.dataSource.getRepository(LoginKayitlari).save({
          Kullanici: user,
          GirisZamani: new Date(),
          IPAdresi: ipAddress,
          CihazBilgisi: deviceInfo,
          BasariliMi: true,
          HataNedeni: null,
        });
      } catch (error) {
        throw new Error(`Kullanıcı Oturum Açma sırsında hata oluştu: ${error.message}`);
      }
    }

    // İki faktörlü doğrulama kontrolü
    if (user.isTwoFactorEnabled) {
      const twoFactorResult = await this.handleTwoFactorAuthentication(user, ipAddress, deviceInfo);
      if (twoFactorResult) return twoFactorResult;
    }

    // Token oluşturma ve kullanıcıyı aktif etme
    return await this.generateAccessToken(user, true);
  }

  // Yardımcı Fonksiyonlar

  private async handleEmailVerification(user: Kullanicilar) {
    try {
      const emailSent = await this.sendVerificationEmail(user);
      if (emailSent) {
        return {
          success: true,
          access_token: 'email-verification',
          message: 'Lütfen e-posta adresinize gönderilen doğrulama bağlantısını kullanarak hesabınızı doğrulayın.',
        };
      }
    } catch (error) {
      throw error
    }

  }

  private async handleTwoFactorAuthentication(user: Kullanicilar, ipAddress: string, deviceInfo: string) {
    try {
      const previousLogin = user.loginKayitlari?.slice(-1)[0];
      const requiresTwoFactor =
        !previousLogin ||
        previousLogin.IPAdresi !== ipAddress ||
        previousLogin.CihazBilgisi !== deviceInfo;

      if (requiresTwoFactor) {
        try {
          const twoFactorResult = await this.twoFactorCodeGenerate(user);

          return twoFactorResult;
        } catch (error) {
          throw error
        }
      }
    } catch (error) {
      throw error
    }
  }

  private async generateAccessToken(user: Kullanicilar, isSuccess: boolean) {
    try {
      if (isSuccess) {
        const payload = {
          userId: user.id,
          email: user.Email,
          role: user.role,
          userTypeEnum: user.KullaniciTipi
        };

        await this.dataSource.getRepository(Kullanicilar).update(user.id, { isActive: true });

        return {
          success: true,
          access_token: this.jwtService.sign(payload),
        };
      }
      return { success: false, message: 'Oturum açma hatası' };
    } catch (error) {
      throw new Error(`Erişim belirteci oluşturulamadı: ${error.message}`);
    }
  }


  async logout(userId: number, platform: 'android' | 'ios' | 'web') {
    try {
      // userId kontrolü yap
      if (!userId) {
        throw new BadRequestException('User ID zorunludur');
      }

      // Kullanıcıyı bul
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
        relations: ['Cihazlar']
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      // Kullanıcının aktif durumunu güncelle
      try {
        let guncelDurum = false;
        if (user.Cihazlar) {
          const filterAktifCihazlar = user.Cihazlar.filter(c => c.isActive === true);
          if (filterAktifCihazlar && filterAktifCihazlar.length > 1) {
            guncelDurum = true;
          } else if (filterAktifCihazlar && filterAktifCihazlar.length === 1) {
            guncelDurum = false;
          }
          if (filterAktifCihazlar.find(c => c.Platform === platform)) {
            await this.dataSource.getRepository(KullaniciCihazlari).update({ KullaniciID: user.id, Platform: platform }, { isActive: false });
          }
        }
        if (user.isActive !== guncelDurum) {
          await this.dataSource.getRepository(Kullanicilar).update(user.id, { isActive: guncelDurum });
        }
        return { message: 'Oturum kapatma işlemi başarılı' };
      } catch (error) {
        throw new ForbiddenException('Kullanıcı oturum sonlandırma işleminde hata oluştu. ');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Oturum sonlandırma işlemi sırasında bir hata oluştu.');
    }
  }


  async twoFactorLogin(code: string, email: string) {
    try {
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { Email: email },
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      if (!user.isTwoFactorEnabled) {
        throw new BadRequestException('Bu hesap iki faktörlü kimlik doğrulama için etkinleştirilmemiş');
      }

      if (!user.isVerified) {
        throw new BadRequestException('Bu hesap doğrulanmamış');
      }

      if (user.deletedAt) {
        throw new BadRequestException('Bu hesap silinmiş');
      }

      const hashedCode = createHash('sha256').update(code).digest('hex');
      if (user.twoFactorSecret !== hashedCode) {
        throw new BadRequestException('Doğrulama kodu yanlış');
      }

      try {
        const payloadUser = {
          KullaniciId: user.id,
          Email: user.Email,
          role: user.role,
          KullaniciTipi: user.KullaniciTipi
        };
        await this.dataSource.getRepository(Kullanicilar).update(user.id, {
          isActive: true,
        });
        return {
          success: true,
          access_token: this.jwtService.sign(payloadUser),
        };
      } catch (error) {
        throw new ForbiddenException('Kullanıcı oturum açma işleminde hata oluştu. ');
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('2 faktörlü kullanıcı giriş işlemi sırasında bir hata oluştu.');
    }
  }

  async twoFactorCodeGenerate(user: Kullanicilar) {
    const twoFactorCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    try {
      const hash = createHash('sha256').update(twoFactorCode).digest('hex');
      await this.dataSource
        .getRepository(Kullanicilar)
        .update(user.id, { twoFactorSecret: hash });
    } catch (error) {
      throw new Error(`İki faktörlü doğrulama kodu oluşturamadı: ${error.message}`);
    }

    //Kullanıcının doğrulama yöntemine göre bakılıp sms yada email gönderimi yapılacak
    //TODO: Kullanıcının doğrulama yöntemini veritabanından alıp kontrol et

    const twoFactorType = 'sms';
    const twoFactorPayload = '05535063864';

    if (twoFactorType === 'sms') {
      const message = `Merhaba ${user.AdSoyad}, iki faktörlü giriş için doğrulama kodunuz: ${twoFactorCode}`;
      try {
        await this.smsService.sendSms(twoFactorPayload, message);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error; // NestJS hata yönetimini koru
        }
        throw new InternalServerErrorException('SMS gönderme işlemi sırasında bir hata oluştu.');
      }
      return {
        success: true,
        message: 'Doğrulama kodu gönderildi',
        access_token: '2fa',
        email: user?.Email,
        type: 'sms',
        phoneNumber: twoFactorPayload,
      };
    } else if (twoFactorType === 'email') {
      try {
        await this.mailService.sendEmailWithTemplate(
          'two-factor-code', // Şablon ismi
          {
            userName: user.AdSoyad,
            twoFactorCode: twoFactorCode,
          },
          user.Email
        );
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error; // NestJS hata yönetimini koru
        }
        throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
      }
      return {
        success: true,
        message: 'Doğrulama kodu gönderildi',
        access_token: '2fa',
        email: user.Email,
        type: 'email',
        phoneNumber: null,
      };
    }
  }

  async register(registerDto: RegisterDto, ipAddress: string, deviceInfo: string) {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      firmaAdi
    } = registerDto;
    // Email kontrolü
    const existingUserByEmail = await this.dataSource
      .getRepository(Kullanicilar)
      .findOne({
        where: { Email: email },
      });

    if (existingUserByEmail) {
      throw new BadRequestException('E-posta adresi zaten kayıtlı');
    }



    if (!password || !confirmPassword) {
      throw new BadRequestException('Şifre ve şifre tekrarı alanları gereklidir.');
    }
    if (password !== confirmPassword) {
      throw new BadRequestException('Şifre ve şifre tekrarı aynı değil.');
    }


    try {
      // Şifreyi hash'leme
      const hashedPassword = await bcrypt.hash(password, 10);

      // Transaction ile kullanıcı ve login bilgisi kaydı
      const savedUser = await this.dataSource.transaction(async (manager) => {
        // Kullanıcı kaydı
        const user = await manager.getRepository(Kullanicilar).save({
          Email: email,
          AdSoyad: fullName,
          FirmaAdi: firmaAdi,
          KullaniciTipi: 1,
          Sifre: hashedPassword,
          isActive: false,
          role: 'user',
        });

        // Login kaydı
        await manager.getRepository(LoginKayitlari).save({
          KullaniciId: user.id,
          GirisZamani: new Date(),
          IPAdresi: ipAddress,
          CihazBilgisi: deviceInfo,
          BasariliMi: false,
        });

        // Transaction sonunda kullanıcıyı döndür
        return user;
      });
      try {
        const sendvisible = await this.sendVerificationEmail(savedUser)
        if (sendvisible) {
          return {
            success: true,
            message: 'Lütfen e-posta adresinize gönderilen doğrulama bağlantısını kullanarak hesabınızı doğrulayın',
            access_token: 'email-verification',
          };
        }

      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error; // NestJS hata yönetimini koru
        }
        throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
      }
      return await this.generateAccessToken(savedUser, true);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Kullanıcı kayıt işlemi sırasında bir hata oluştu.');
    }
  }


  async getCurrentUser(userId: number) {
    try {
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
        relations: ['Cihazlar']
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      const Abonelik = await this.dataSource.getRepository(FirmaAbonelikleri).createQueryBuilder('abonelik')
        .where('abonelik.KullaniciID = :KullaniciID', { KullaniciID: user.id })
        .andWhere('abonelik.Durum = :Durum', { Durum: 'Aktif' })
        .leftJoinAndSelect('abonelik.AbonelikPlan', 'abonelikPlan')
        .getOne();
    

      // Şifreyi çıkar
      let { Sifre, ...result } = user;

      // Tipi genişletmek için TypeScript'e bilgi veriyoruz
      if (Abonelik && Abonelik.AbonelikPlan) {
        return { ...result, Abonelik:Abonelik.AbonelikPlan.PlanAdi } as typeof result & { Abonelik: string };
      }

      return result;
    } catch (error) {
      console.log(error)
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Kullanıcı bilgileri çekme işlemi sırasında bir hata oluştu.');
    }
  }



  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { Email: email },
    });
    if (!user) {
      throw new BadRequestException('Bu e-posta adresiyle kullanıcı bulunamadı');
    }

    // Reset token oluştur
    const resetToken = this.jwtService.sign(
      { email: user.Email },
      { expiresIn: '1h' },
    );

    // Reset URL oluştur
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/change?token=${resetToken}&email=${email}`;
    try {
      await this.mailService.sendEmailWithTemplate(
        'password-reset', // Şablon ismi
        {
          userName: user.AdSoyad,
          resetUrl: resetUrl,
        },
        user.Email
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
    }
    return {
      success: true,
      message: 'Şifre sıfırlama linki e-posta adresinize gönderilmiştir'
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, password_confirmation, email, token } = resetPasswordDto;
    if (password !== password_confirmation) {
      throw new BadRequestException('Şifre ve şifre tekrarı aynı değil');
    }

    try {
      const decoded = this.jwtService.verify(token);

      // Doğrulanan token'dan email al
      if (decoded.email !== email) {
        throw new BadRequestException('Doğrulama token ı ve e-posta eşleşmiyor');
      }


      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { Email: email },
        select: ['id', 'Email', 'Sifre', 'deletedAt', 'isVerified'],
      });
      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }



      // Yeni şifreyi hashle ve güncelle
      const hashedPassword = await bcrypt.hash(password, 10);
      if (!user.isVerified) {
        await this.dataSource
          .getRepository(Kullanicilar)
          .update(user.id, { Sifre: hashedPassword, isVerified: true, verifiedAt: new Date() });
      } else {
        await this.dataSource
          .getRepository(Kullanicilar)
          .update(user.id, { Sifre: hashedPassword });
      }


      return {
        message: 'Şifreniz başarıyla güncellendi',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token süresi doldu');
      } else {
        throw new UnauthorizedException('Geçersiz token');
      }
    }
  }

  async sendVerificationEmail(user: Kullanicilar) {
    if (user.isVerified) {
      return false;
    }

    // Doğrulama token oluştur
    const verificationToken = this.jwtService.sign(
      { email: user.Email },
      { expiresIn: '24h' }, // Token süresi (örnek: 24 saat)
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;

    // Kullanıcının doğrulama linki email adresine gönderilecek
    try {
      await this.mailService.sendEmailWithTemplate(
        'verify-email', // Şablon ismi
        {
          userName: user.AdSoyad,
          verificationUrl: verificationUrl,
        },
        user.Email
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
    }

    return true;
  }

  async verifyEmailToken(
    token: string,
    password: string,
    ipAddress: string,
    deviceInfo: string,
  ): Promise<any> {
    try {
      // Token'ı çöz
      let payload: any;
      try {
        payload = this.jwtService.verify(token);

      } catch (error) {
        throw new BadRequestException(
          error.message || 'Süresi dolmuş yada geçersiz token',
        );
      }
      // Email adresine göre kullanıcıyı bul

      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { Email: payload.email },
        select: ['id', 'Email', 'Sifre', 'deletedAt', 'KullaniciTipi']
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      // Zaten doğrulanmış mı?
      if (user.isVerified) {
        return { message: 'Hesap zaten doğrulanmış' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.Sifre);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Geçersiz şifre');
      }

      // Kullanıcıyı doğrula
      user.isVerified = true;
      user.verifiedAt = new Date();
      await this.dataSource.getRepository(Kullanicilar).save(user);

      const newUserLogin = await this.dataSource.transaction(
        async (manager) => {
          await manager.getRepository(LoginKayitlari).save({
            KullaniciId: user.id,
            Email: user.Email,
            GirisZamani: new Date(),
            IPAdresi: ipAddress,
            CihazBilgisi: deviceInfo,
            BasariliMi: true,
            HataNedeni: null,
          });
        },
      );

      await this.dataSource.getRepository(Kullanicilar).update(user.id, {
        isActive: true
      });
      const payloadlogin = {
        KullaniciId: user.id,
        Email: user.Email,
        role: user.role,
        KullaniciTipi: user.KullaniciTipi
      };

      return {
        success: true,
        access_token: this.jwtService.sign(payloadlogin),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('E-posta doğrulama işlemi sırasında bir hata oluştu.');
    }
  }

  async verifyResendEmail(email: string) {
    const user = await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { Email: email },
    });
    if (!user) {
      throw new BadRequestException('Bu E-posta adresiyle kayıtlı kullanıcı bulunamadı.');
    }
    if (user.isVerified) {
      throw new BadRequestException('Bu E-posta adresi zaten doğrulanmış.');
    }

    try {
      const senvisible = await this.sendVerificationEmail(user)
      if (senvisible) {
        return {
          success: true,
          message: 'E-posta adresine doğrulama bağlantısı gönderildi',
        };
      } else {
        throw new BadRequestException(
          'E-posta adresine doğrulama bağlantısı gönderirken hata oluştu.',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
    }

  }

  async getUserByEmail(email: string) {
    return await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { Email: email },
    });
  }

  async twoFactorResend(email: string) {
    const user = await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { Email: email },
    });

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException(
        'Bu hesap iki faktörlü kimlik doğrulama için etkinleştirilmemiş',
      );
    }

    if (user.deletedAt) {
      throw new BadRequestException('Bu hesap silinmiş');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Bu hesap doğrulanmamış');
    }

    return this.twoFactorCodeGenerate(user);
  }

  async updatePassword(updatePasswordDto: ChangePasswordDto, userId: number) {
    const { oldPassword, newPassword, confirmPassword } = updatePasswordDto;


    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Yeni şifre ve şifre tekrarı aynı değil');
    }

    const user = await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { id: userId },
      select: ['id', 'Email', 'Sifre', 'deletedAt']
    });

    if (!oldPassword) {
      throw new BadRequestException(
        'Eski şifrenizi yanlış veya eksik bir şekilde girdiniz.',
      );
    }
    try {
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.Sifre,
      );
      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Eski şifrenizi yanlış veya eksik bir şekilde girdiniz.');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Bcrypt şifre çözümleme işlemi sırasında bir hata oluştu.');
    }


    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this.dataSource
        .getRepository(Kullanicilar)
        .update(user.id, { Sifre: hashedNewPassword });
      return { message: 'Şifre başarıyla güncellendi' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Şifer güncelleme işlemi sırasında bir hata oluştu.');
    }
  }

  async updateEmail(userId: number, email: string) {
    if (!email) {
      throw new BadRequestException('E-posta adresi zorunludur');
    }

    try {
      const emailvisible = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { Email: email },
      });

      if (emailvisible) {
        throw new BadRequestException('Bu e-posta adresi kullanılıyor');
      }
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
        select: ['id', 'Email', 'Sifre', 'deletedAt']
      });
      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }


      await this.dataSource.getRepository(Kullanicilar).update(userId, { Email: email, verifiedAt: null, isVerified: false, isActive: false });
      try {
        const updateuser = await this.dataSource.getRepository(Kullanicilar).findOne({
          where: { id: userId }
        });
        const sendvisible = await this.sendVerificationEmail(updateuser);
        if (sendvisible) {
          return {
            status: 201,
            message:
              'Lütfen e-posta adresinize gönderilen doğrulama bağlantısını kullanarak hesabınızı doğrulayın',
            access_token: 'email-verification',
          };
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error; // NestJS hata yönetimini koru
        }
        throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('E-posta adresi değiştirme işlemi sırasında bir hata oluştu.');
    }
  }



  async updateUserInfo(fullName: string,firmaAdi: string, phoneNumber: string, userId: number) {
    try {
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      if (phoneNumber) {
        const phoneRegex = /^(\+90|90|0)?5\d{9}$/; // Türkiye mobil numarası formatı
        if (!phoneRegex.test(phoneNumber)) {
          throw new BadRequestException('Geçersiz telefon numarası');
        }
      }

      try {
        await this.dataSource.getRepository(Kullanicilar).update(userId, { AdSoyad: fullName, Telefon: phoneNumber,FirmaAdi:firmaAdi });

      } catch (error) {
        throw new Error(error)
      }
      const updatedUser = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
      });

      if (!updatedUser) {
        throw new BadRequestException('Güncellenmiş kullanıcı alınamadı');
      }

      const { Sifre, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Kullanıcı bilgileri güncelleme işlemi sırasında bir hata oluştu.');
    }

  }

  async updateUserAvatar(filePath: string, userId: number) {
    try {
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }
      let profilimage = user.ProfilResmi;
      if (filePath) {
        // URL'den dosya yolunu ayıkla
        const oldImagePath = user.ProfilResmi ?
          user.ProfilResmi.replace('/public/', '') : null;
        if (oldImagePath) {
          const fullPath = path.join(process.cwd(), 'public', oldImagePath);

          try {
            if (fs.existsSync(fullPath)) {
              await fs.promises.unlink(fullPath);
            } else {
              console.log('Dosya bulunamadı:', fullPath);
            }
          } catch (err) {
            console.error('Dosya silme hatası:', err);
          }
        }
        profilimage = `${filePath}`;
      }

      try {
        await this.dataSource.getRepository(Kullanicilar).update(userId, { ProfilResmi: profilimage });

      } catch (error) {
        throw new Error(error)
      }

      return profilimage;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      console.log(error)
      throw new InternalServerErrorException('Kullanıcı bilgileri güncelleme işlemi sırasında bir hata oluştu.');
    }

  }

  async accountDelete(userId: number) {
    try {
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      try {
        await this.dataSource.getRepository(Kullanicilar).softDelete({ id: userId });

      } catch (error) {
        throw new Error(error)
      }

      return { status: 201, message: 'Hesap başarıyla silindi' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Hesap silme işlemi sırasında bir hata oluştu.');
    }

  }


  async avatarDelete(userId: number) {
    try {
      const user = await this.dataSource.getRepository(Kullanicilar).findOne({
        where: { id: userId },
        select: ['id', 'ProfilResmi'],
      });

      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }
      // URL'den dosya yolunu ayıkla
      const oldImagePath = user.ProfilResmi ?
        user.ProfilResmi.replace('/public/', '') : null;
      if (oldImagePath) {
        const fullPath = path.join(process.cwd(), 'public', oldImagePath);

        try {
          if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
          } else {
            console.log('Dosya bulunamadı:', fullPath);
          }
        } catch (err) {
          console.error('Dosya silme hatası:', err);
        }
      }

      // Profil resmini veritabanından kaldır
      try {
        await this.dataSource.getRepository(Kullanicilar).update(userId, { ProfilResmi: null });
      } catch (error) {
        console.error('Veritabanı güncelleme hatası:', error);
        throw new BadRequestException('Profil resmi güncellenemedi');
      }

      return { status: 201, message: 'Profil resmi silindi' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // NestJS hata yönetimini koru
      }
      throw new InternalServerErrorException('Profil resmi silme işlemi sırasında bir hata oluştu.');
    }

  }
}
