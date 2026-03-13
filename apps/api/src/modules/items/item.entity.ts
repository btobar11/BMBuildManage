import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Stage } from '../stages/stage.entity';

@Entity('items')
@Index(['stage_id'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stage_id: string;

  @ManyToOne(() => Stage, (stage) => stage.items)
  @JoinColumn({ name: 'stage_id' })
  stage: Stage;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_cost: number;

  @Column({ nullable: true, length: 100 })
  cost_code: string;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotal() {
    this.total_cost = Number(this.quantity) * Number(this.unit_cost);
  }

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
