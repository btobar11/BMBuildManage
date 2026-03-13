import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../projects/project.entity';

export enum DocumentType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  PLAN = 'plan',
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

  @CreateDateColumn()
  created_at: Date;
}
