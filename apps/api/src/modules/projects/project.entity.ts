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
import { ProjectPayment } from './project-payment.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
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
  address: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  commune: string;

  // Computed property for backward compatibility - combines address, region, commune
  get location(): string {
    const parts = [this.address, this.commune, this.region].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }

  @Column({ type: 'text', array: true, nullable: true })
  type: string[];

  @Column({ nullable: true })
  folder: string;

  @Column({ type: 'varchar', default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimated_budget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimated_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated_area: number;

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

  @OneToMany(() => ProjectPayment, (pp) => pp.project)
  project_payments: ProjectPayment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
