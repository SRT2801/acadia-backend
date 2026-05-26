import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AcademicSpace } from '../../academic-spaces/entities/academic-space.entity';
import { Channel } from './channel.entity';

@Entity({ name: 'channel_categories' })
export class ChannelCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'int' })
  academicSpaceId!: number;

  @ManyToOne(() => AcademicSpace, (space) => space.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'academicSpaceId' })
  academicSpace?: AcademicSpace;

  @OneToMany(() => Channel, (channel) => channel.category)
  channels?: Channel[];
}
