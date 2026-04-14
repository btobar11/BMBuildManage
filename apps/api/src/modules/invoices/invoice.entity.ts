import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Company } from '../companies/company.entity';
import { InvoiceItem } from './invoice-item.entity';

/**
 * DTE Types (SII Chile)
 * @see https://www.sii.cl/factura_electronica/factura_ev.htm
 */
export enum DteType {
  FACTURA_AFECTA = 33,
  FACTURA_EXENTA = 34,
  NOTA_CREDITO = 61,
  NOTA_DEBITO = 56,
  GUIA_DESPACHO = 51,
}

/**
 * Invoice Status (SII acceptance)
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  ELECTRONICALLY_SIGNED = 'electronically_signed',
  SENT_TO_SII = 'sent_to_sii',
  ACCEPTED_BY_SII = 'accepted_by_sii',
  REJECTED_BY_SII = 'rejected_by_sii',
  TIMEOUT_REACHED = 'timeout_reached',
}

/**
 * Invoice Payment Status — Tracks procurement match state
 */
export enum InvoicePaymentStatus {
  PENDING_RECEPTION = 'pending_reception',
  PENDING_MATCH = 'pending_match',
  READY_FOR_PAYMENT = 'ready_for_payment',
  PAID = 'paid',
}

/**
 * Invoice Entity - Chilean Electronic Invoice (DTE)
 *
 * Supports Factura Afecta (33), Factura Exenta (34),
 * Nota de Crédito (61), Nota de Débito (56)
 */
@Entity('invoices')
@Index(['company_id'])
@Index(['project_id'])
@Index(['status'])
@Index(['folio'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ nullable: true })
  project_id: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // ==================== LINE ITEMS ====================

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  // ==================== DTE HEADER ====================

  @Column({ length: 10, nullable: true })
  folio: string;

  @Column({
    type: 'enum',
    enum: DteType,
    default: DteType.FACTURA_AFECTA,
  })
  tipo_dte: DteType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  fecha_emision: Date;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_sello: Date;

  // ==================== EMISOR (SELLER) ====================

  @Column({ length: 12, nullable: true })
  rut_emisor: string;

  @Column({ length: 200, nullable: true })
  razon_social_emisor: string;

  @Column({ length: 200, nullable: true })
  giro_emisor: string;

  @Column({ length: 100, nullable: true })
  actividad_economica_emisor: string;

  @Column({ length: 100, nullable: true })
  direccion_emisor: string;

  @Column({ length: 50, nullable: true })
  comuna_emisor: string;

  // ==================== RECEPTOR (BUYER) ====================

  @Column({ length: 12, nullable: true })
  rut_receptor: string;

  @Column({ length: 200, nullable: true })
  razon_social_receptor: string;

  @Column({ length: 200, nullable: true })
  giro_receptor: string;

  @Column({ length: 100, nullable: true })
  direccion_receptor: string;

  @Column({ length: 50, nullable: true })
  comuna_receptor: string;

  // ==================== TOTALS ====================

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto_neto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto_iva: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto_exento: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto_total: number;

  // IVA rate (default 19% for Chile)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19 })
  tasa_iva: number;

  // ==================== IVA RECLAMADO ====================

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto_iva_reclamado: number;

  // ==================== REFERENCES ====================

  @Column({ length: 100, nullable: true })
  folio_referencia: string;

  @Column({
    type: 'enum',
    enum: DteType,
    nullable: true,
  })
  tipo_referencia: DteType;

  @Column({ type: 'text', nullable: true })
  motivo_referencia: string;

  // ==================== SII TRACKING ====================

  @Column({ length: 40, nullable: true })
  track_id: string;

  @Column({ nullable: true })
  token_sii: string;

  @Column({ type: 'text', nullable: true })
  xml_envio: string;

  @Column({ type: 'text', nullable: true })
  xml_respuesta: string;

  @Column({ nullable: true })
  numero_interno: string;

  @Column({ type: 'text', nullable: true })
  errores_sii: string;

  // ==================== LEGACY FIELDS (for backwards compatibility) ====================

  @Column({ length: 300, nullable: true })
  supplier: string;

  @Column({ length: 100, nullable: true })
  invoice_number: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ type: 'text', nullable: true })
  file_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ==================== PROCUREMENT MATCH ====================

  @Column({ nullable: true })
  purchase_order_id: string;

  @Column({
    type: 'enum',
    enum: InvoicePaymentStatus,
    default: InvoicePaymentStatus.PENDING_MATCH,
    nullable: true,
  })
  payment_status: InvoicePaymentStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
