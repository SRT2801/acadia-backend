import { RolesEnum } from '../modules/roles/enums/roles.enum';
import { PermissionsEnum } from '../modules/roles/enums/permissions.enum';

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  userId: number;
  email: string;
  roleId: number;
  universityId: number;
  sessionId: number;
  roleName: string;
  permissions: PermissionsEnum[];
}

export type { RolesEnum, PermissionsEnum };
