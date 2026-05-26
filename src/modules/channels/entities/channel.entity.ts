import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AcademicSpace } from '../../academic-spaces/entities/academic-space.entity';
import { ChannelCategory } from './channel-category.entity';
import { ChannelType } from '../../courses/enums/channel-type.enum';

@Entity({ name: 'channels' })
export class Channel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.TEXT })
  type!: ChannelType;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ nullable: true })
  icon?: string;

  @Column({ type: 'int' })
  academicSpaceId!: number;

  @ManyToOne(() => AcademicSpace, (space) => space.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'academicSpaceId' })
  academicSpace?: AcademicSpace;

  @Column({ type: 'int', nullable: true })
  categoryId?: number;

  @ManyToOne(() => ChannelCategory, (category) => category.channels, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: ChannelCategory;

  @Column({ type: 'int' })
  createdById!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column({ default: false })
  isLocked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
