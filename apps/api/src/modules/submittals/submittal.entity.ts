import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Project } from '../projects/project.entity';

export enum SubmittalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested',
}

export enum SubmittalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SubmittalType {
  SHOP_DRAWINGS = 'shop_drawings',
  PRODUCT_DATA = 'product_data',
  SAMPLES = 'samples',
  CERTIFICATES = 'certificates',
  MANUALS = 'manuals',
  OTHER = 'other',
}

@Entity('submittals')
export class Submittal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company_id!: string;

  @Column()
  project_id!: string;

  @ManyToOne(() => Project)
  project!: Project;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'enum', enum: SubmittalType, default: SubmittalType.OTHER })
  type!: SubmittalType;

  @Column({
    type: 'enum',
    enum: SubmittalStatus,
    default: SubmittalStatus.DRAFT,
  })
  status!: SubmittalStatus;

  @Column({
    type: 'enum',
    enum: SubmittalPriority,
    default: SubmittalPriority.MEDIUM,
  })
  priority!: SubmittalPriority;

  @Column({ nullable: true })
  spec_section!: string;

  @Column({ nullable: true })
  submitted_by!: string;

  @Column({ nullable: true })
  reviewed_by!: string;

  @Column({ type: 'timestamp', nullable: true })
  due_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  submitted_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_date!: Date;

  @Column({ type: 'text', nullable: true })
  comments!: string;

  @Column({ nullable: true })
  document_url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
