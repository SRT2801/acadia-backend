import dataSource from '../data-source';
import { Role } from '../../../modules/roles/entities/role.entity';
import { Permission } from '../../../modules/roles/entities/permission.entity';
import { RolePermission } from '../../../modules/roles/entities/role-permission.entity';
import { User } from '../../../modules/users/entities/user.entity';
import { RolesEnum, ALL_ROLES } from '../../../modules/roles/enums/roles.enum';
import {
  PermissionsEnum,
  ALL_PERMISSIONS,
} from '../../../modules/roles/enums/permissions.enum';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await dataSource.initialize();
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);
  const rpRepo = dataSource.getRepository(RolePermission);
  const userRepo = dataSource.getRepository(User);

  // Insert permissions
  const permissionMap = new Map<string, Permission>();
  for (const name of ALL_PERMISSIONS) {
    let p = await permRepo.findOne({ where: { name } });
    if (!p) {
      p = permRepo.create({ name });
      await permRepo.save(p);
      console.log('Inserted permission', name);
    }
    permissionMap.set(name, p);
  }

  // Insert roles
  const roleMap = new Map<string, Role>();
  for (const name of ALL_ROLES) {
    let r = await roleRepo.findOne({ where: { name } });
    if (!r) {
      r = roleRepo.create({ name });
      await roleRepo.save(r);
      console.log('Inserted role', name);
    }
    roleMap.set(name, r);
  }

  // Define role -> permissions mapping (uses enums, not raw ids)
  const rolePermissionsMap: Record<RolesEnum, PermissionsEnum[]> = {
    [RolesEnum.STUDENT]: [PermissionsEnum.CREATE_TASK],
    [RolesEnum.PROFESSOR]: [
      PermissionsEnum.CREATE_TASK,
      PermissionsEnum.GRADE_SUBMISSION,
      PermissionsEnum.MANAGE_COURSE,
      PermissionsEnum.SEND_ANNOUNCEMENT,
    ],
    [RolesEnum.ADMIN]: ALL_PERMISSIONS,
    [RolesEnum.MODERATOR]: [
      PermissionsEnum.DELETE_TASK,
      PermissionsEnum.SEND_ANNOUNCEMENT,
    ],
  };

  // Insert role_permissions
  for (const [roleName, perms] of Object.entries(rolePermissionsMap)) {
    const role = roleMap.get(roleName);
    if (!role) continue;
    for (const permName of perms) {
      const perm = permissionMap.get(permName);
      if (!perm) continue;
      const exists = await rpRepo.findOne({
        where: { roleId: role.id, permissionId: perm.id },
      });
      if (!exists) {
        const rp = rpRepo.create({ roleId: role.id, permissionId: perm.id });
        await rpRepo.save(rp);
        console.log(`Granted ${perm.name} -> ${role.name}`);
      }
    }
  }

  // Insert Admin User
  const adminEmail = 'admin@acadia.com';
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });

  if (!adminUser) {
    const adminRole = roleMap.get(RolesEnum.ADMIN);
    if (adminRole) {
      const hashedPassword = await bcrypt.hash('Admin1234!', 10);
      adminUser = userRepo.create({
        email: adminEmail,
        username: 'superadmin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: adminRole.id, // ID del rol ADMIN
        universityId: 1, // Valor por defecto
        status: 'ACTIVE',
      });
      await userRepo.save(adminUser);
      console.log('Inserted Super Admin user:', adminEmail);
    }
  }

  await dataSource.destroy();
  console.log('RBAC seed & Admin User completed');
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
