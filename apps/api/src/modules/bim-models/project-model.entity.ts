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

@Entity('project_models')
@Index(['project_id'])
export class ProjectModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  storage_path: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @CreateDateColumn()
  created_at: Date;
}
