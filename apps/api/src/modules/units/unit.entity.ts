import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UnitCategory {
  LENGTH = 'longitud',
  AREA = 'area',
  VOLUME = 'volumen',
  WEIGHT = 'peso',
  TIME = 'tiempo',
  QUANTITY = 'cantidad',
  OTHER = 'otro',
}

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ type: 'enum', enum: UnitCategory, default: UnitCategory.OTHER })
  category: UnitCategory;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
