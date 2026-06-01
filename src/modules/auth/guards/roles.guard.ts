import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolesEnum } from '../../roles/enums/roles.enum';
import { PermissionsEnum } from '../../roles/enums/permissions.enum';

interface AuthenticatedUser {
  userId: number;
  roleName: string;
  permissions: PermissionsEnum[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolesEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionsEnum[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as AuthenticatedUser | undefined;

    if (!user) {
      return false;
    }

    let hasRole = true;
    if (requiredRoles) {
      hasRole = requiredRoles.includes(user.roleName as RolesEnum);
    }

    let hasPermission = true;
    if (requiredPermissions) {
      hasPermission = requiredPermissions.every((permission) =>
        user.permissions?.includes(permission),
      );
    }

    return hasRole && hasPermission;
  }
}
