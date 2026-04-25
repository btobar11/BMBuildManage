import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('upgrade_attempts')
export class UpgradeAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  company_id: string;

  @Column('uuid')
  user_id: string;

  @Column({ length: 100 })
  feature_code: string;

  @CreateDateColumn()
  created_at: Date;
}
