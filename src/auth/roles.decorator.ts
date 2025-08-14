import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: number[]) => SetMetadata('roles', roles);

export const UserRoles = (...permissions: string[]) => SetMetadata('permissions', permissions);

export const YetkiUserRoles = (...permissions: string[]) => SetMetadata('firma_permissions', permissions);
