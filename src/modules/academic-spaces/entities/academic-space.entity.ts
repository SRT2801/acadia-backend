import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { Channel } from '../../channels/entities/channel.entity';
import { ChannelCategory } from '../../channels/entities/channel-category.entity';
import { Visibility } from '../../courses/enums/visibility.enum';

@Entity({ name: 'academic_spaces' })
export class AcademicSpace {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'enum', enum: Visibility, default: Visibility.PRIVATE })
  visibility!: Visibility;

  @Column({ type: 'int', unique: true })
  courseId!: number;

  @OneToOne(() => Course, (course) => course.academicSpace, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course?: Course;

  @Column({ type: 'int' })
  ownerId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner?: User;

  @Column({ type: 'jsonb', default: '{}' })
  settings!: Record<string, unknown>;

  @OneToMany(() => Channel, (channel) => channel.academicSpace)
  channels?: Channel[];

  @OneToMany(() => ChannelCategory, (category) => category.academicSpace)
  categories?: ChannelCategory[];

  @CreateDateColumn()
  createdAt!: Date;
}
