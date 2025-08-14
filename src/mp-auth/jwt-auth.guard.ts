import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class MpJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err:any, user:any, info:any) {
        if (err || !user) {
          if (info instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedException('Geçersiz veya süresi dolmuş jeton');
          }
          throw new UnauthorizedException('Yetkilendirme Gerekli');
        }
        return user;
      }
}
