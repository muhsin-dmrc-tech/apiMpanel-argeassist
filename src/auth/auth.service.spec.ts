import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Kullanicilar)
    private KullanicilarRepository: Repository<Kullanicilar>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Kullanıcıyı e-posta ile bul
    const Kullanicilar = await this.KullanicilarRepository.findOne({ where: { Email:email } });
    if (!Kullanicilar) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    // Şifre doğrulama
    const isPasswordValid = await bcrypt.compare(password, Kullanicilar.Sifre);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    // JWT token oluştur ve dön
    const payload = { KullanicilarId: Kullanicilar.id, email: Kullanicilar.Email };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }
}
