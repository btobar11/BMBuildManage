import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('addon_features')
@Index(['addon_code', 'feature_code'], { unique: true })
export class AddonFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  addon_code: string;

  @Column({ length: 100 })
  feature_code: string;

  @CreateDateColumn()
  created_at: Date;
}
