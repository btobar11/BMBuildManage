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
  VersionColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Stage } from '../stages/stage.entity';

export enum BudgetStatus {
  DRAFT = 'draft',
  EDITING = 'editing',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COUNTER_OFFER = 'counter_offer',
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

  @VersionColumn()
  version: number;

  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.DRAFT })
  status: BudgetStatus;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_estimated_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_estimated_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  professional_fee_percentage: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimated_utility: number;

  @OneToMany(() => Stage, (stage) => stage.budget, { cascade: true, orphanedRowAction: 'delete' })
  stages: Stage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
