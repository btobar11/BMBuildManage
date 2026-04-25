import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { PlanTier } from './subscription.entity';

/**
 * PlanFeature maps which features are available for each plan tier.
 * This is the source of truth for feature gating.
 */
@Entity('plan_features')
@Index(['plan', 'feature_code'], { unique: true })
export class PlanFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PlanTier })
  plan: PlanTier;

  @Column({ length: 100 })
  feature_code: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}
