import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pricing_metrics')
export class PricingMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column({ length: 50 })
  segment: string; // 'construction', 'architecture', 'engineering'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  arpu: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  churn_probability: number;

  @Column({ type: 'jsonb' })
  usage_stats: any; // { projects, items, bim_clashes }

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  recommended_price: number;

  @Column({ type: 'boolean', default: false })
  is_applied: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
