import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MENTION = 'MENTION',
  INVITATION = 'INVITATION',
}

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int', nullable: true })
  senderId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender?: User;

  @Column({ type: 'int', nullable: true })
  channelId?: number;

  @Column({ type: 'int', nullable: true })
  courseId?: number;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}