import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Item } from '../items/item.entity';
import { Resource } from '../resources/resource.entity';
import { Project } from '../projects/project.entity';

@Entity('resource_consumption')
@Index(['project_id'])
@Index(['budget_item_id'])
@Index(['resource_id'])
export class ResourceConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column()
  budget_item_id: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'budget_item_id' })
  budget_item: Item;

  @Column()
  resource_id: string;

  @ManyToOne(() => Resource)
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_cost: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  date: Date;
}
