import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rpRepo: Repository<RolePermission>,
  ) {}

  findAll() {
    return this.roleRepo.find();
  }

  async findById(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(name: string) {
    const role = this.roleRepo.create({ name });
    return this.roleRepo.save(role);
  }

  async getPermissionsForRole(roleId: number) {
    const rps = await this.rpRepo.find({
      where: { roleId },
      relations: ['permission'],
    });
    return rps.map((rp) => rp.permission?.name).filter(Boolean) as string[];
  }

  async assignPermissions(roleId: number, permissionIds: number[]) {
    const role = await this.findById(roleId);
    for (const pid of permissionIds) {
      const perm = await this.permRepo.findOne({ where: { id: pid } });
      if (!perm) continue;
      const exists = await this.rpRepo.findOne({
        where: { roleId: role.id, permissionId: perm.id },
      });
      if (!exists) {
        await this.rpRepo.save(
          this.rpRepo.create({ roleId: role.id, permissionId: perm.id }),
        );
      }
    }
    return this.getPermissionsForRole(role.id as number);
  }

  async removePermission(roleId: number, permissionId: number) {
    await this.rpRepo.delete({ roleId, permissionId });
    return this.getPermissionsForRole(roleId);
  }

  findAllPermissions() {
    return this.permRepo.find();
  }
}
