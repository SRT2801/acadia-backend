import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RolesService } from '../../roles/roles.service';
import { SessionsService } from '../sessions.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private rolesService: RolesService,
    private sessionsService: SessionsService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.sessionsService.findById(payload.sessionId);

    if (!session || session.expiredAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

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
