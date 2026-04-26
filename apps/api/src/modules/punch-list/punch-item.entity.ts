import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PunchItemStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  CLOSED = 'closed',
}

export enum PunchItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('punch_items')
export class PunchItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company_id!: string;

  @Column()
  project_id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: PunchItemStatus,
    default: PunchItemStatus.OPEN,
  })
  status!: PunchItemStatus;

  @Column({
    type: 'enum',
    enum: PunchItemPriority,
    default: PunchItemPriority.MEDIUM,
  })
  priority!: PunchItemPriority;

  @Column({ nullable: true })
  location!: string;

  @Column({ nullable: true })
  reported_by!: string;

  @Column({ nullable: true })
  assigned_to!: string;

  @Column({ type: 'timestamp', nullable: true })
  due_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_date!: Date;

  @Column({ nullable: true })
  photo_url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
