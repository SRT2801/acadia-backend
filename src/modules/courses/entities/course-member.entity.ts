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
import { CourseMemberRole } from '../../courses/enums/course-member-role.enum';
import { CourseMemberStatus } from '../../courses/enums/course-member-status.enum';

@Entity({ name: 'course_members' })
export class CourseMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int' })
  courseId!: number;

  @ManyToOne(() => Course, (course) => course.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course?: Course;

  @Column({
    type: 'enum',
    enum: CourseMemberRole,
    default: CourseMemberRole.STUDENT,
  })
  role!: CourseMemberRole;

  @Column({
    type: 'enum',
    enum: CourseMemberStatus,
    default: CourseMemberStatus.ACTIVE,
  })
  status!: CourseMemberStatus;

  @CreateDateColumn()
  joinedAt!: Date;
}
