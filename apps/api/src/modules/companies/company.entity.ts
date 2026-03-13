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

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

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
