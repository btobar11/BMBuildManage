import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Addon } from './addon.entity';
// Import Company entity if available, using any for now or omitting the relation.
// We'll just define the foreign keys.

export enum AddonBillingCycle {
  MONTHLY = 'monthly',
  ONE_TIME = 'one_time',
}

export enum CompanyAddonStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

@Entity('company_addons')
export class CompanyAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  company_id: string;

  @Column()
  addon_code: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: AddonBillingCycle,
  })
  billing_cycle: AddonBillingCycle;

  @CreateDateColumn()
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: CompanyAddonStatus,
    default: CompanyAddonStatus.ACTIVE,
  })
  status: CompanyAddonStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Addon)
  @JoinColumn({ name: 'addon_code', referencedColumnName: 'code' })
  addon: Addon;
}
