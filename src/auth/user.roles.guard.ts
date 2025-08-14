import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm'; // TypeORM DataSource

/* import { Role } from './roles.entity';
import { Permission } from './permissions.entity'; */

@Injectable()
export class UserRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource, // TypeORM kullanıyoruz
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Hiçbir izin belirtilmemişse geçmesine izin ver
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    // Kullanıcının rolünü veritabanından al
   /*  const role = await this.dataSource.getRepository(Role).findOne({
      where: { id: user.role },
      relations: ['permissions'],
    });

    if (!role) {
      throw new ForbiddenException('User role is invalid');
    }

    // Kullanıcı rolünün izinlerini kontrol et
    const userPermissions = role.permissions.map((rolePermission) => rolePermission.permission.action);

    // Kullanıcı gerekli izinlerden birine sahip mi?
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
 */
    return true;
  }
}



/*     yapılacaklar    
   tabloları oluşturma 

@Entity('Roles')
export class Roles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  permissions: RolePermission[];
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;
}

@Entity('role_permissions')
export class RolePermission {
  @ManyToOne(() => Role, (role) => role.permissions)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.id)
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;
}
  

Kullanım örneği 


@Controller('products')
export class ProductsController {
  @UseGuards(RolesGuard)
  @Roles('create-product')
  @Post('create')
  createProduct() {
    // Ürün oluşturma işlemi
  }
}


*/
