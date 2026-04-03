import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('project_contingencies')
@Index(['project_id'])
export class ProjectContingency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_cost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  date: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotal() {
    this.total_cost = Number(this.quantity) * Number(this.unit_cost);
  }
}
