import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';

/**
 * Invoice Item Entity - Line items for DTE
 */
@Entity('invoice_items')
@Index(['invoice_id'])
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoice_id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'int', default: 1 })
  numero_linea: number;

  @Column({ length: 200, nullable: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 50, nullable: true })
  codigo: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 1 })
  cantidad: number;

  @Column({ length: 20, nullable: true })
  unidad: string;

  @Column({ type: 'decimal', precision: 15, scale: 6, default: 0 })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  descuento_porcentaje: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  descuento_monto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto_total: number;

  // Reference to budget item (optional)
  @Column({ nullable: true })
  budget_item_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
