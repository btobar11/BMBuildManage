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
import { Company } from '../companies/company.entity';

@Entity('stages')
@Index(['budget_id'])
@Index(['company_id'])
export class Stage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column()
  budget_id: string;

  @ManyToOne(() => Budget, (budget) => budget.stages)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 300 })
  name: string;

  @Column({ default: 0 })
  position: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_price: number;

  @OneToMany(() => Item, (item) => item.stage, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  items: Item[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
