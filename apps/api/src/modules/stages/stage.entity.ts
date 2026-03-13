import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Budget } from '../budgets/budget.entity';
import { Item } from '../items/item.entity';

@Entity('stages')
@Index(['budget_id'])
export class Stage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  budget_id: string;

  @ManyToOne(() => Budget, (budget) => budget.stages)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ length: 300 })
  name: string;

  @Column({ default: 0 })
  position: number;

  @OneToMany(() => Item, (item) => item.stage)
  items: Item[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
