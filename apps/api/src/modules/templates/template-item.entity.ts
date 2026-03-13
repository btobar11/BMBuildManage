import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TemplateStage } from './template-stage.entity';

@Entity('template_items')
@Index(['template_stage_id'])
export class TemplateItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  template_stage_id: string;

  @ManyToOne(() => TemplateStage, (stage) => stage.items)
  @JoinColumn({ name: 'template_stage_id' })
  template_stage: TemplateStage;

  @Column({ length: 300 })
  name: string;

  @Column({ nullable: true, length: 50 })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  default_quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  default_cost: number;
}
