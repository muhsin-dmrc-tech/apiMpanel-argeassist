import { Injectable, CanActivate, ExecutionContext, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirmaAbonelikleri } from 'src/firma-abonelikleri/entities/firma-abonelikleri.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class YetkiRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'firma_permissions',
      context.getHandler(),
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Eğer izin belirtilmemişse, geçişe izin ver
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User role not found');
    }
    if (user.userTypeEnum === 2) {
      return true;
    }

    // Abonelik kontrolü
    const abonelik = await this.dataSource.getRepository(FirmaAbonelikleri).findOne({
      where: { KullaniciID: user.id },
    });
    if (!abonelik) {
      throw new HttpException(
        {
          statusCode: 442,
          KullaniciID: user.id,
          message: 'Firma ya ait aktif abonelik bulunamadı.',
          error: 'No Active Subscription',
        },
        442,
      );
    }

    const bitisTarihi = new Date(abonelik.BitisTarihi);
    const bugun = new Date();

    if (bitisTarihi < bugun) {
      throw new HttpException(
        {
          statusCode: 442,
          KullaniciID: user.id,
          message: 'Firma ya ait aktif abonelik süresi dolmuş.',
          error: 'Subscription Expired',
        },
        442,
      );
    }




    return true;
  }
}


