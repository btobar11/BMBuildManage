import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  AfterUpdate,
} from 'typeorm';
import { ResourcePriceHistory } from './resource-price-history.entity';
import { Unit } from '../units/unit.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

export enum ResourceType {
  MATERIAL = 'material',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
}

@Entity('resources')
@Index(['company_id'])
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'enum', enum: ResourceType, default: ResourceType.MATERIAL })
  type: ResourceType;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ nullable: true })
  unit_id: string;

  @Column({ length: 150, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  base_price: number;

  @OneToMany(() => ResourcePriceHistory, (h) => h.resource, { cascade: false })
  price_history: ResourcePriceHistory[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
