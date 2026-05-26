import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { University } from '../../universities/entities/university.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  username!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ default: 'ACTIVE' })
  status?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  emailVerifiedAt?: Date;

  @Exclude()
  @Column({ nullable: true })
  verificationToken?: string;

  @Exclude()
  @Column({ nullable: true, type: 'timestamptz' })
  verificationTokenExpiresAt?: Date;

  @Column({ type: 'int' })
  roleId!: number;

  @Column({ type: 'int' })
  universityId!: number;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'universityId' })
  university?: University;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
