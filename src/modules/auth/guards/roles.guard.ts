import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolesEnum } from '../../roles/enums/roles.enum';
import { PermissionsEnum } from '../../roles/enums/permissions.enum';

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

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false; // El usuario no está autenticado, debería fallar
    }

    let hasRole = true;
    if (requiredRoles) {
      hasRole = requiredRoles.includes(user.roleName);
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
