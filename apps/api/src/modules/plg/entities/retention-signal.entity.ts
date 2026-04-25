import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('retention_signals')
export class RetentionSignal {
  @PrimaryColumn('uuid')
  company_id: string;

  @Column({ length: 10, nullable: true })
  risk_level: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_activity: Date;

  @Column({ type: 'int', nullable: true })
  engagement_score: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
