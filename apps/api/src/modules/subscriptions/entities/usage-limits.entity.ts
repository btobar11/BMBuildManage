import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { PlanTier } from './subscription.entity';

/**
 * UsageLimits defines hard caps per plan tier.
 * One row per plan. Checked at runtime by guards & services.
 */
@Entity('usage_limits')
@Index(['plan'], { unique: true })
export class UsageLimits {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PlanTier, unique: true })
  plan: PlanTier;

  @Column({ type: 'int', default: 3 })
  max_projects: number;

  @Column({ type: 'int', default: 5 })
  max_users: number;

  @Column({ type: 'int', default: 500 })
  max_storage_mb: number;

  @Column({ type: 'int', default: 0 })
  max_ai_requests_month: number;

  @Column({ type: 'int', default: 0 })
  max_bim_models: number;
}
