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
import { Project } from '../projects/project.entity';
import { Company } from '../companies/company.entity';

export enum ExpenseType {
  MATERIAL = 'material',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

@Entity('expenses')
@Index(['project_id'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, (project) => project.expenses)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column()
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ nullable: true })
  item_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ExpenseType, default: ExpenseType.OTHER })
  expense_type: ExpenseType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  document_url: string;

  @Column({ nullable: true })
  document_id: string;

  @ManyToOne('Document', { nullable: true })
  @JoinColumn({ name: 'document_id' })
  document: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
