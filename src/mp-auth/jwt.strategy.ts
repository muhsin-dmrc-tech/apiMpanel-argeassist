import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { MpKullanicilar } from 'src/mp-kullanicilar/entities/mp-kullanicilar.entity';
import { DataSource } from 'typeorm';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dataSource: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.dataSource
      .getRepository(MpKullanicilar)
      .findOne({
        where: {
          id: payload.userId,
          Email: payload.email
        }
      });

    if (!user) {
      throw new UnauthorizedException('Geçersiz kullanıcı');
    }

   return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      userTypeEnum: payload.userTypeEnum,
    };
  }
}
