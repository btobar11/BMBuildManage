import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Worker } from '../workers/worker.entity';
import { Project } from '../projects/project.entity';

export enum PaymentType {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CHECK = 'check',
  OTHER = 'other',
}

@Entity('worker_payments')
@Index(['worker_id'])
@Index(['project_id'])
export class WorkerPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  worker_id: string;

  @ManyToOne(() => Worker, (worker) => worker.payments)
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, (project) => project.worker_payments)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.CASH })
  payment_type: PaymentType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
