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

  @CreateDateColumn()
  created_at: Date;
}
