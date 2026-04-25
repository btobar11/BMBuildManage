import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Stage } from '../stages/stage.entity';
import { FormulaEngine } from './utils/formula-engine';
import { Company } from '../companies/company.entity';

export enum CubicationMode {
  MANUAL = 'manual',
  DIMENSIONS = 'dimensions',
  CAD = 'cad',
  PDF = 'pdf',
  BIM = 'bim',
}

export enum ItemType {
  MATERIAL = 'material',
  LABOR = 'labor',
  MACHINERY = 'machinery',
  SUBCONTRACT = 'subcontract',
}

@Entity('items')
@Index(['stage_id'])
@Index(['company_id'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column()
  stage_id: string;

  @ManyToOne(() => Stage, (stage) => stage.items)
  @JoinColumn({ name: 'stage_id' })
  stage: Stage;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'enum', enum: ItemType, default: ItemType.MATERIAL })
  type: ItemType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unit_cost: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    insert: false,
    update: false,
  })
  total_cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unit_price: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    insert: false,
    update: false,
  })
  total_price: number;

  @Column({ nullable: true, length: 100 })
  cost_code: string;

  @Column({ default: 0 })
  position: number;

  // --- APU reference ---
  @Column({ nullable: true })
  apu_template_id: string;

  // --- Cubicación ---
  @Column({
    type: 'enum',
    enum: CubicationMode,
    default: CubicationMode.MANUAL,
  })
  cubication_mode: CubicationMode;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  dim_length: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  dim_width: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  dim_height: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  dim_thickness: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  dim_count: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  dim_holes: number;

  @Column({ type: 'text', nullable: true })
  formula: string;

  @Column({ type: 'jsonb', nullable: true })
  geometry_data: any;

  // --- BIM / IFC link ---
  @Column({ nullable: true, length: 64 })
  ifc_global_id: string;

  // --- Ejecución real ---
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity_executed: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  real_cost: number;

  @Column({ default: false })
  is_price_overridden: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotals() {
    // 1. If formula is present, recalculate quantity
    if (this.formula && this.formula.trim() !== '') {
      const area = this.geometry_data?.area || 0;
      const perimetro = this.geometry_data?.perimetro || 0;

      this.quantity = FormulaEngine.evaluate(this.formula, {
        largo: Number(this.dim_length) || 0,
        ancho: Number(this.dim_width) || 0,
        alto: Number(this.dim_height) || 0,
        espesor: Number(this.dim_thickness) || 0,
        cantidad: Number(this.dim_count) || 1,
        area: Number(area) || 0,
        perimetro: Number(perimetro) || 0,
        huecos: Number(this.dim_holes) || 0,
        piezas: Number(this.dim_count) || 1,
      });
    }

    // 2. Ensure numeric types are not NaN
    // Note: total_cost and total_price are GENERATED ALWAYS columns in DB
    if (isNaN(this.quantity)) this.quantity = 0;
  }

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
