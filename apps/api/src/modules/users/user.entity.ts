import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../companies/company.entity';

export enum UserRole {
  ADMIN = 'admin',
  ENGINEER = 'engineer',
  ARCHITECT = 'architect',
  SITESUPERVISOR = 'site_supervisor',
  FOREMAN = 'foreman',
  ACCOUNTING = 'accounting',
  VIEWER = 'viewer',
  WORKER = 'worker',
}

@Entity('users')
@Index(['company_id'])
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ENGINEER })
  role: UserRole;

  @Column({ nullable: true })
  company_id: string;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
