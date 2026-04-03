import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApuResource } from './apu-resource.entity';

import { Unit } from '../units/unit.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

@Entity('apu_templates')
@Index(['company_id'])
export class ApuTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  company_id: string;

  @Column({ length: 300 })
  name: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ nullable: true })
  unit_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  default_formula: string;

  @Column({ length: 100, nullable: true })
  default_geometry_layer: string;

  @OneToMany(() => ApuResource, (r) => r.apu_template, { cascade: true, orphanedRowAction: 'delete' })
  apu_resources: ApuResource[];

  // Computed field (not stored in DB, calculated on-the-fly)
  unit_cost?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
