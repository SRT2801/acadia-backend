import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { University } from '../../universities/entities/university.entity';

@Entity({ name: 'faculties' })
export class Faculty {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'int' })
  universityId!: number;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'universityId' })
  university?: University;

  @CreateDateColumn()
  createdAt!: Date;
}
