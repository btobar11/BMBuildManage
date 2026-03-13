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
import { Company } from '../companies/company.entity';
import { Client } from '../clients/client.entity';
import { Budget } from '../budgets/budget.entity';
import { Expense } from '../expenses/expense.entity';
import { WorkerAssignment } from '../worker-assignments/worker-assignment.entity';
import { WorkerPayment } from '../worker-payments/worker-payment.entity';
import { Document } from '../documents/document.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

@Entity('projects')
@Index(['company_id'])
@Index(['client_id'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Company, (company) => company.projects)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ nullable: true })
  client_id: string;

  @ManyToOne(() => Client, (client) => client.projects, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimated_budget: number;

  @OneToMany(() => Budget, (budget) => budget.project)
  budgets: Budget[];

  @OneToMany(() => Expense, (expense) => expense.project)
  expenses: Expense[];

  @OneToMany(() => WorkerAssignment, (wa) => wa.project)
  worker_assignments: WorkerAssignment[];

  @OneToMany(() => WorkerPayment, (wp) => wp.project)
  worker_payments: WorkerPayment[];

  @OneToMany(() => Document, (doc) => doc.project)
  documents: Document[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
