import dataSource from '../data-source';
import { Role } from '../../../modules/roles/entities/role.entity';
import { Permission } from '../../../modules/roles/entities/permission.entity';
import { RolePermission } from '../../../modules/roles/entities/role-permission.entity';
import { User } from '../../../modules/users/entities/user.entity';
import { University } from '../../../modules/universities/entities/university.entity';
import { RolesEnum, ALL_ROLES } from '../../../modules/roles/enums/roles.enum';
import {
  PermissionsEnum,
  ALL_PERMISSIONS,
} from '../../../modules/roles/enums/permissions.enum';
import {
  UniversitiesEnum,
  ALL_UNIVERSITIES,
} from '../../../modules/universities/enums/universities.enum';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await dataSource.initialize();
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);
  const rpRepo = dataSource.getRepository(RolePermission);
  const userRepo = dataSource.getRepository(User);
  const universityRepo = dataSource.getRepository(University);

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
    [RolesEnum.STUDENT]: [
      PermissionsEnum.CREATE_TASK,
      PermissionsEnum.JOIN_COURSE,
    ],
    [RolesEnum.PROFESSOR]: [
      PermissionsEnum.CREATE_TASK,
      PermissionsEnum.GRADE_SUBMISSION,
      PermissionsEnum.MANAGE_COURSE,
      PermissionsEnum.SEND_ANNOUNCEMENT,
      PermissionsEnum.JOIN_COURSE,
      PermissionsEnum.INVITE_MEMBERS,
      PermissionsEnum.MANAGE_MEMBERS,
      PermissionsEnum.CREATE_CHANNELS,
      PermissionsEnum.DELETE_MESSAGES,
    ],
    [RolesEnum.ADMIN]: ALL_PERMISSIONS,
    [RolesEnum.MODERATOR]: [
      PermissionsEnum.DELETE_TASK,
      PermissionsEnum.SEND_ANNOUNCEMENT,
      PermissionsEnum.JOIN_COURSE,
      PermissionsEnum.DELETE_MESSAGES,
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

  // Insert universities
  const universityMap = new Map<string, University>();
  for (const u of ALL_UNIVERSITIES) {
    let existing = await universityRepo.findOne({
      where: { domain: u.domain },
    });
    if (!existing) {
      existing = universityRepo.create(u);
      await universityRepo.save(existing);
      console.log('Inserted university:', u.name);
    }
    universityMap.set(u.domain, existing);
  }

  // Insert Admin User
  const adminEmail = 'admin@acadia.com';
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });

  if (!adminUser) {
    const adminRole = roleMap.get(RolesEnum.ADMIN);
    if (adminRole) {
      const hashedPassword = await bcrypt.hash('Admin1234!', 10);
      const unicolombo = universityMap.get(UniversitiesEnum.UNICOLOMBO);
      adminUser = userRepo.create({
        email: adminEmail,
        username: 'superadmin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: adminRole.id,
        universityId: unicolombo!.id,
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
