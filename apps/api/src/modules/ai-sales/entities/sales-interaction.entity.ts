import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum OpportunityType {
  UPGRADE_PLAN = 'upgrade_plan',
  BUY_ADDON = 'buy_addon',
  INCREASE_USAGE = 'increase_usage_limit',
  RENEW_SUBSCRIPTION = 'renew_subscription',
}

@Entity('sales_interactions')
export class SalesInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: OpportunityType,
  })
  opportunity_type: OpportunityType;

  @Column('text')
  message: string;

  @Column()
  cta: string;

  @Column({ default: 'medium' })
  urgency: string;

  @Column({ nullable: true })
  target_plan: string;

  @Column({ nullable: true })
  target_addon: string;

  @CreateDateColumn()
  shown_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  clicked_at: Date;

  @Column({ default: false })
  converted: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  conversion_value: number;

  @Column({ default: false })
  dismissed: boolean;
}
