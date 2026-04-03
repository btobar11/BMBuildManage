import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Worker } from '../workers/worker.entity';
import { Project } from '../projects/project.entity';

@Entity('worker_assignments')
@Index(['worker_id'])
@Index(['project_id'])
export class WorkerAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  worker_id: string;

  @ManyToOne(() => Worker, (worker) => worker.assignments)
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, (project) => project.worker_assignments)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  daily_rate: number;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  performance_rating: number;

  @Column({ type: 'text', nullable: true })
  performance_notes: string;

  @Column({ type: 'text', nullable: true })
  task_description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_paid: number;

  @CreateDateColumn()
  created_at: Date;
}
