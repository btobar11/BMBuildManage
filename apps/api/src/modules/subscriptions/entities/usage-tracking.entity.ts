import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('usage_tracking')
@Index(['company_id', 'metric_code', 'period_start', 'period_end'], {
  unique: true,
})
export class UsageTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  company_id: string;

  @Column({ length: 100 })
  metric_code: string;

  @Column('int', { default: 0 })
  usage_value: number;

  @Column('date')
  period_start: Date;

  @Column('date')
  period_end: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
