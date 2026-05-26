import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity({ name: 'invitations' })
export class Invitation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'int' })
  courseId!: number;

  @ManyToOne(() => Course, (course) => course.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course?: Course;

  @Column({ type: 'int' })
  createdById!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'int', default: 0 })
  maxUses!: number;

  @Column({ type: 'int', default: 0 })
  uses!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
