import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Item } from '../items/item.entity';

@Entity('budget_execution_logs')
@Index(['budget_item_id'])
export class BudgetExecutionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  budget_item_id: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_item_id' })
  budget_item: Item;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity_executed: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  real_cost: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  date: Date;
}
