import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Project } from '../projects/project.entity';

export enum RfiStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ANSWERED = 'answered',
  CLOSED = 'closed',
}

export enum RfiPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('rfis')
export class Rfi {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  project_id!: string;

  @ManyToOne(() => Project)
  project!: Project;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  question!: string;

  @Column({ type: 'text', nullable: true })
  answer!: string;

  @Column({ nullable: true })
  submitted_by!: string;

  @Column({ nullable: true })
  answered_by!: string;

  @Column({ type: 'timestamp', nullable: true })
  due_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  answered_at!: Date;

  @Column({ type: 'enum', enum: RfiStatus, default: RfiStatus.DRAFT })
  status!: RfiStatus;

  @Column({ type: 'enum', enum: RfiPriority, default: RfiPriority.MEDIUM })
  priority!: RfiPriority;

  @Column({ nullable: true })
  category!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
