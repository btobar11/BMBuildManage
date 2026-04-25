import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('plg_metrics_snapshot')
export class PlgMetricsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  activation_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  churn_rate: number;

  @Column({ type: 'int', nullable: true })
  dau: number;

  @Column({ type: 'int', nullable: true })
  wau: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
