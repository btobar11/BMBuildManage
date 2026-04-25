import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AddonType {
  FEATURE = 'feature',
  USAGE = 'usage',
  SERVICE = 'service',
}

@Entity('addons')
export class Addon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: AddonType,
  })
  type: AddonType;

  @Column({ nullable: true })
  price_monthly: number;

  @Column({ nullable: true })
  price_one_time: number;

  @Column({ nullable: true })
  required_plan: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
