import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('activation_status')
export class ActivationStatus {
  @PrimaryColumn('uuid')
  company_id: string;

  @Column({ default: false })
  is_activated: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  activated_at: Date;

  @Column({ type: 'int', default: 0 })
  activation_score: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_calculated: Date;
}
