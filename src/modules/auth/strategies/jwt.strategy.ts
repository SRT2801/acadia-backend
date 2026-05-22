import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private rolesService: RolesService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const role = await this.rolesService.findById(payload.roleId);
    const permissions = await this.rolesService.getPermissionsForRole(
      payload.roleId,
    );

    return {
      ...payload,
      roleName: role.name,
      permissions: permissions,
    };
  }
}
