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

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_RECEIVED = 'partially_received',
  FULLY_RECEIVED = 'fully_received',
  INVOICED = 'invoiced',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
@Index(['company_id'])
@Index(['project_id'])
@Index(['status'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 50, nullable: true })
  po_number: string;

  @Column({ length: 300 })
  supplier_name: string;

  @Column({ length: 12, nullable: true })
  supplier_rut: string;

  @Column({ length: 200, nullable: true })
  supplier_contact: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'date', nullable: true })
  expected_delivery_date: Date;

  @Column({ type: 'date', nullable: true })
  sent_date: Date;

  @Column({ nullable: true })
  invoice_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchase_order, {
    cascade: true,
  })
  items: PurchaseOrderItem[];

  @OneToMany(() => PurchaseOrderReceipt, (receipt) => receipt.purchase_order, {
    cascade: true,
  })
  receipts: PurchaseOrderReceipt[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('purchase_order_items')
@Index(['purchase_order_id'])
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  purchase_order_id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column({ nullable: true })
  budget_item_id: string;

  @Column({ nullable: true })
  resource_id: string;

  @Column({ length: 300 })
  description: string;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity_ordered: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity_received: number;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('purchase_order_receipts')
@Index(['purchase_order_id'])
export class PurchaseOrderReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  purchase_order_id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.receipts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column({ length: 200 })
  received_by: string;

  @Column({ type: 'date' })
  reception_date: Date;

  @Column({ length: 100, nullable: true })
  guia_despacho_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  photo_url: string;

  @OneToMany(() => ReceiptItem, (item) => item.receipt, { cascade: true })
  items: ReceiptItem[];

  @CreateDateColumn()
  created_at: Date;
}

@Entity('receipt_items')
@Index(['receipt_id'])
export class ReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  receipt_id: string;

  @ManyToOne(() => PurchaseOrderReceipt, (r) => r.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receipt_id' })
  receipt: PurchaseOrderReceipt;

  @Column()
  purchase_order_item_id: string;

  @ManyToOne(() => PurchaseOrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_item_id' })
  purchase_order_item: PurchaseOrderItem;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity_received: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
