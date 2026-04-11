import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../items/item.entity';
import { Project } from '../projects/project.entity';

/**
 * BIM-APU Link Entity
 * 
 * Maps IFC elements to budget items (APU).
 * Enables automated quantity takeoff synchronization.
 */
@Entity('bim_apu_links')
@Index(['company_id'])
@Index(['project_id'])
@Index(['item_id'])
@Index(['ifc_global_id'])
export class BimApuLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column()
  item_id: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  // IFC Element Reference
  @Column({ length: 64 })
  ifc_global_id: string;

  @Column({ nullable: true, length: 64 })
  ifc_type: string;

  @Column({ nullable: true, length: 200 })
  element_name: string;

  // BIM Quantities (nullable for optional data)
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  net_volume: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  net_area: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  gross_volume: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  gross_area: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  length: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  width: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  height: number | null;

  // Linking Configuration
  @Column({
    type: 'enum',
    enum: ['volume', 'area', 'length', 'count'],
    default: 'volume',
  })
  quantity_type: 'volume' | 'area' | 'length' | 'count';

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 1 })
  quantity_multiplier: number | null;

  @Column({ default: true })
  auto_sync_enabled: boolean;

  // Last Sync Tracking
  @Column({ type: 'timestamp', nullable: true })
  last_synced_at: Date;

  @Column({ nullable: true })
  last_synced_by: string;

  // Link Metadata
  @Column({ default: 'active' })
  status: 'active' | 'archived' | 'superseded';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}