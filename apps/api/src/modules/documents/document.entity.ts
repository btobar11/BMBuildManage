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

export enum DocumentType {
  PLAN = 'plan',
  QUANTITY_TAKEOFF = 'quantity_takeoff',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PURCHASE_ORDER = 'purchase_order',
  PERMIT = 'permit',
  PHOTO = 'photo',
  OTHER = 'other',
}

@Entity('documents')
@Index(['project_id'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, (project) => project.documents)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploaded_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
