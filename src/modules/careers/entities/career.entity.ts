import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { University } from '../../universities/entities/university.entity';
import { Faculty } from '../../faculties/entities/faculty.entity';

@Entity({ name: 'careers' })
export class Career {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'int', nullable: true })
  facultyId?: number;

  @ManyToOne(() => Faculty, { nullable: true })
  @JoinColumn({ name: 'facultyId' })
  faculty?: Faculty;

  @Column({ type: 'int' })
  universityId!: number;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'universityId' })
  university?: University;

  @CreateDateColumn()
  createdAt!: Date;
}
