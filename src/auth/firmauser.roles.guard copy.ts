import { Injectable, CanActivate, ExecutionContext, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Personel } from 'src/personel/entities/personel.entity';
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

    let iliskiId = null;


    if (user.userTypeEnum === 1) {
      iliskiId = request.params.firmaId || request.body.FirmaID || request.query.FirmaID ||
        request.params.iliskiId || request.body.IliskiID || request.query.IliskiID || null;
      if (!iliskiId) {
        throw new ForbiddenException('Firma ID zorunludur');
      }
    } else {
      iliskiId = request.params.teknokentId || request.body.TeeknokentID || request.query.TeknokentID ||
        request.params.iliskiId || request.body.IliskiID || request.query.IliskiID || null;
      if (!iliskiId) {
        throw new ForbiddenException('Teknokent ID zorunludur');
      }
    }

    // Kullanıcının izinlerini veritabanından al
   /*  const queryBuilder = this.dataSource.getRepository(Personel).createQueryBuilder('personel')
      .where('personel.IliskiID = :id', { id: iliskiId })
      .andWhere('personel.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 })
      .andWhere('personel.KullaniciID = :KullaniciID', { KullaniciID: user.userId })
      .leftJoinAndSelect('personel.Grup', 'Grup')
      .leftJoinAndSelect('Grup.Yetkiler', 'Yetkiler');

    if (user.KullaniciTipi === 1) {
      queryBuilder.leftJoinAndMapOne('Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID');
    } else if (user.KullaniciTipi === 3) {
      queryBuilder.leftJoinAndMapOne('Teknokentler', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
    }
    const yetki = await queryBuilder.getOne();
    if (!yetki) {
      throw new ForbiddenException('Yetki bulunamadı');
    }
    if (user.userTypeEnum === 1) {
      if (yetki.Firma.IsDeleted === true) {
        throw new ForbiddenException('Firma silinmiş');
      }
    }else{
      if (yetki.Teknokent.IsDeleted === true) {
      throw new ForbiddenException('Teknokent silinmiş');
    }
    } */

    // Abonelik kontrolü
    /*  const abonelik = await this.dataSource.getRepository(FirmaAbonelikleri).findOne({
       where: { FirmaID: firmaId },
     });
     if (yetki.Rol === 'owner') {
       if (!abonelik) {
         throw new HttpException(
           {
             statusCode: 442,
             FirmaID: firmaId,
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
             FirmaID: firmaId,
             message: 'Firma ya ait aktif abonelik süresi dolmuş.',
             error: 'Subscription Expired',
           },
           442,
         );
       }
 
 
       return true; // Eğer kullanıcı owner ise, geçişe izin ver
     } */


   /*  if (yetki.Rol !== 'owner') {
      if (!yetki.Grup) {
        throw new ForbiddenException('Kullanıcı bir gruba atanmadığı için yetkisi yok');
      }
      if (!yetki.Grup.Yetkiler || yetki.Grup.Yetkiler.length === 0) {
        throw new ForbiddenException('Kullanıcının grubu için yetki tanımlı değil');
      }
      // Kullanıcı izinlerini kontrol et
      const userPermissions = yetki.Grup?.Yetkiler.map((rolePermission) => rolePermission.Yetki);

      // Kullanıcının gerekli izinlerden birine sahip olup olmadığını kontrol et
      const hasPermission = requiredPermissions?.some((permission) =>
        userPermissions?.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok');
      }
    } */



    return true;
  }
}


