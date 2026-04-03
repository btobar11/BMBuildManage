import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Resource } from './resource.entity';

@Entity('resource_price_history')
@Index(['resource_id'])
export class ResourcePriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resource_id: string;

  @ManyToOne(() => Resource, (resource) => resource.price_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @CreateDateColumn()
  date: Date;
}
