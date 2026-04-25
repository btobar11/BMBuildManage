import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../companies/company.entity';

export enum PlanTier {
  LITE = 'lite',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity('subscriptions')
@Index(['company_id'], { unique: true })
@Index(['status'])
@Index(['end_date'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'enum', enum: PlanTier, default: PlanTier.LITE })
  plan: PlanTier;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
  billing_cycle: BillingCycle;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'date', nullable: true })
  trial_ends_at: Date;

  @Column({ type: 'boolean', default: true })
  auto_renew: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthly_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_price: number;

  @Column({ length: 3, default: 'CLP' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'varchar', nullable: true })
  last_payment_id: string;

  @Column({ type: 'timestamp', nullable: true })
  next_billing_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
