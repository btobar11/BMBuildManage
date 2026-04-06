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
import { Company } from '../companies/company.entity';
import { Project } from '../projects/project.entity';

export enum SubcontractorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum ContractType {
  LUMP_SUM = 'lump_sum',
  UNIT_PRICE = 'unit_price',
  COST_PLUS = 'cost_plus',
  TIME_AND_MATERIALS = 'time_and_materials',
}

@Entity('subcontractors')
@Index(['company_id'])
export class Subcontractor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 300 })
  name: string;

  @Column({ nullable: true })
  trade: string;

  @Column({ nullable: true })
  nit: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  contract_value: number;

  @Column({ type: 'enum', enum: SubcontractorStatus, default: SubcontractorStatus.ACTIVE })
  status: SubcontractorStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('subcontractor_contracts')
@Index(['project_id'])
@Index(['subcontractor_id'])
export class SubcontractorContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column()
  subcontractor_id: string;

  @ManyToOne(() => Subcontractor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subcontractor_id' })
  subcontractor: Subcontractor;

  @Column({ length: 300 })
  scope: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ContractType })
  contract_type: ContractType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  contract_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  approved_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ type: 'date', nullable: true })
  completed_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('subcontractor_payments')
@Index(['contract_id'])
export class SubcontractorPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contract_id: string;

  @ManyToOne(() => SubcontractorContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SubcontractorContract;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ length: 100, nullable: true })
  invoice_number: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  approved: boolean;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ type: 'date', nullable: true })
  approved_date: Date;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('subcontractor_ram')
@Index(['contract_id'])
export class SubcontractorRAM {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contract_id: string;

  @ManyToOne(() => SubcontractorContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SubcontractorContract;

  @Column({ length: 300 })
  item: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  approved_quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  executed_quantity: number;

  @CreateDateColumn()
  created_at: Date;
}