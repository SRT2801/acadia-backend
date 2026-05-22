import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'password_reset_tokens' })
@Index(['email'])
@Index(['token'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column({ unique: true })
  token!: string;

  @Column()
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  usedAt?: Date;
}
