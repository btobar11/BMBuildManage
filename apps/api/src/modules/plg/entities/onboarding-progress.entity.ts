import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('onboarding_progress')
@Unique(['company_id', 'user_id', 'step_code'])
export class OnboardingProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column()
  user_id: string;

  @Column({ length: 50 })
  step_code: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
