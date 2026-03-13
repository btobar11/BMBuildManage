import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Template } from './template.entity';
import { TemplateItem } from './template-item.entity';

@Entity('template_stages')
@Index(['template_id'])
export class TemplateStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  template_id: string;

  @ManyToOne(() => Template, (template) => template.stages)
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column({ length: 300 })
  name: string;

  @Column({ default: 0 })
  position: number;

  @OneToMany(() => TemplateItem, (item) => item.template_stage)
  items: TemplateItem[];
}
