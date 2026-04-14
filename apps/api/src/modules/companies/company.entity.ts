import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Client } from '../clients/client.entity';
import { Project } from '../projects/project.entity';
import { Worker } from '../workers/worker.entity';
import { Template } from '../templates/template.entity';

export enum CompanySpecialty {
  RESIDENTIAL = 'residential',
  CIVIL_WORKS = 'civil_works',
  RENOVATIONS = 'renovations',
  INDUSTRIAL = 'industrial',
  COMMERCIAL = 'commercial',
}

export enum SeismicZone {
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
}

export enum CompanyLegalType {
  SPA = 'SpA',
  EIRL = 'EIRL',
  LTDA = 'Ltda.',
  SA = 'S.A.',
  EI = 'Empresa Individual',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 20, nullable: true })
  rut: string;

  @Column({ length: 50, nullable: true })
  tax_id: string;

  @Column({ length: 50, nullable: true })
  legal_type: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column('text', { array: true, nullable: true })
  industry: string[];

  @Column('text', { array: true, nullable: true })
  challenges: string[];

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ length: 20, nullable: true })
  size: string;

  @Column({
    type: 'enum',
    enum: CompanySpecialty,
    nullable: true,
  })
  specialty: CompanySpecialty;

  @Column({
    type: 'enum',
    enum: SeismicZone,
    nullable: true,
  })
  seismic_zone: SeismicZone;

  @Column({ length: 10, nullable: true, default: 'CL-RM' })
  region_code: string;

  @Column({ length: 10, nullable: true, default: 'CLP' })
  currency: string;

  @Column({ type: 'boolean', default: false })
  library_seeded: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  seeded_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Client, (client) => client.company)
  clients: Client[];

  @OneToMany(() => Project, (project) => project.company)
  projects: Project[];

  @OneToMany(() => Worker, (worker) => worker.company)
  workers: Worker[];

  @OneToMany(() => Template, (template) => template.company)
  templates: Template[];
}
