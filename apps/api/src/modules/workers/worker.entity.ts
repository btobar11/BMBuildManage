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
import { WorkerAssignment } from '../worker-assignments/worker-assignment.entity';
import { WorkerPayment } from '../worker-payments/worker-payment.entity';

@Entity('workers')
@Index(['company_id'])
export class Worker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Company, (company) => company.workers)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true, length: 100 })
  role: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  daily_rate: number;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => WorkerAssignment, (wa) => wa.worker)
  assignments: WorkerAssignment[];

  @OneToMany(() => WorkerPayment, (wp) => wp.worker)
  payments: WorkerPayment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
