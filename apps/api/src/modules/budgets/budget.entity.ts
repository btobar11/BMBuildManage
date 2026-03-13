import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Stage } from '../stages/stage.entity';

export enum BudgetStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('budgets')
@Index(['project_id'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, (project) => project.budgets)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.DRAFT })
  status: BudgetStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_estimated_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_estimated_price: number;

  @OneToMany(() => Stage, (stage) => stage.budget)
  stages: Stage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
