import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Company } from '../companies/company.entity';

export enum DocumentType {
  PLAN = 'plan',
  QUANTITY_TAKEOFF = 'quantity_takeoff',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PURCHASE_ORDER = 'purchase_order',
  PERMIT = 'permit',
  PHOTO = 'photo',
  LABOR_COMPLIANCE = 'labor_compliance',
  SOCIAL_SECURITY = 'social_security',
  INSURANCE_POLICY = 'insurance_policy',
  WORK_CONTRACT = 'work_contract',
  OTHER = 'other',
}

@Entity('documents')
@Index(['project_id'])
@Index(['company_id'])
@Index(['project_id', 'company_id'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Project, (project) => project.documents)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @Column({ nullable: true })
  subcontractor_id: string;

  @Column({ length: 7, nullable: true })
  period: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploaded_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
