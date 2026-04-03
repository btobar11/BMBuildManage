import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  name: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  default_price: number;

  @Column({ length: 300, nullable: true })
  supplier: string;

  @CreateDateColumn()
  created_at: Date;
}
