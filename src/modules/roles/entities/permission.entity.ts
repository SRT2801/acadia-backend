import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions!: RolePermission[];
}
