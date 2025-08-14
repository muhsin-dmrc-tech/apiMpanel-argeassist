import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<number[]>(
      'roles',
      context.getHandler(),
    );

    // Eğer hiç rol belirtilmemişse hata döndür
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new UnauthorizedException('Erişim reddedildi: Rol tanımlanmadı');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Kullanıcı nesnesi var mı kontrol et
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Kullanıcı tipi uygun mu kontrol et
    if (typeof user.userTypeEnum !== 'number' && !Array.isArray(user.userTypeEnum)) {
      throw new UnauthorizedException('Invalid user role format');
    }

    // Eğer userTypeEnum bir dizi değilse, onu dizi gibi işlemeye çalış
    const userRoles = Array.isArray(user.userTypeEnum) ? user.userTypeEnum : [user.userTypeEnum];

    // Kullanıcı belirtilen rollerden en az birine sahip mi?
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        'Bu eylemi gerçekleştirme izniniz yok',
      );
    }

    return true;
  }
}
