import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { University } from '../../universities/entities/university.entity';
import { Faculty } from '../../faculties/entities/faculty.entity';
import { Career } from '../../careers/entities/career.entity';
import { User } from '../../users/entities/user.entity';
import { AcademicSpace } from '../../academic-spaces/entities/academic-space.entity';
import { CourseMember } from './course-member.entity';
import { Invitation } from './invitation.entity';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true })
  semester?: string;

  @Column({ type: 'int' })
  universityId!: number;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'universityId' })
  university?: University;

  @Column({ type: 'int', nullable: true })
  facultyId?: number;

  @ManyToOne(() => Faculty, { nullable: true })
  @JoinColumn({ name: 'facultyId' })
  faculty?: Faculty;

  @Column({ type: 'int', nullable: true })
  careerId?: number;

  @ManyToOne(() => Career, { nullable: true })
  @JoinColumn({ name: 'careerId' })
  career?: Career;

  @Column({ type: 'int' })
  createdById!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @OneToOne(() => AcademicSpace, (space) => space.course)
  academicSpace?: AcademicSpace;

  @OneToMany(() => CourseMember, (member) => member.course)
  members?: CourseMember[];

  @OneToMany(() => Invitation, (invitation) => invitation.course)
  invitations?: Invitation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
