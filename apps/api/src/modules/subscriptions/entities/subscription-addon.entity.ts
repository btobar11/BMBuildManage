import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('subscription_addons')
export class SubscriptionAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  subscription_id: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Index()
  @Column({ length: 100 })
  addon_code: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;

  @CreateDateColumn()
  created_at: Date;
}
