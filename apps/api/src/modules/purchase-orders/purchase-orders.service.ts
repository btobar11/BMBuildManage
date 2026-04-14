import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderReceipt,
  PurchaseOrderStatus,
  ReceiptItem,
} from './purchase-order.entity';
import {
  CreatePurchaseOrderDto,
  ReceiveDeliveryDto,
  MatchInvoiceDto,
} from './dto/purchase-order.dto';
import { Invoice } from '../invoices/invoice.entity';

export interface ThreeWayMatchStatus {
  purchase_order_id: string;
  po_number: string;
  supplier_name: string;
  ordered: boolean;
  received: boolean;
  partially_received: boolean;
  invoiced: boolean;
  ready_for_payment: boolean;
  total_ordered: number;
  total_received: number;
  total_invoiced: number;
  reception_percentage: number;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(PurchaseOrderReceipt)
    private readonly receiptRepo: Repository<PurchaseOrderReceipt>,
    @InjectRepository(ReceiptItem)
    private readonly receiptItemRepo: Repository<ReceiptItem>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePurchaseOrderDto, companyId: string) {
    const items = dto.items.map((itemDto) => {
      const item = this.poItemRepo.create({
        ...itemDto,
        total_price: itemDto.quantity_ordered * itemDto.unit_price,
      });
      return item;
    });

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.total_price),
      0,
    );

    const po = this.poRepo.create({
      company_id: companyId,
      project_id: dto.project_id,
      supplier_name: dto.supplier_name,
      supplier_rut: dto.supplier_rut,
      supplier_contact: dto.supplier_contact,
      description: dto.description,
      po_number: dto.po_number,
      expected_delivery_date: dto.expected_delivery_date
        ? new Date(dto.expected_delivery_date)
        : undefined,
      notes: dto.notes,
      total_amount: totalAmount,
      items,
    });

    return this.poRepo.save(po);
  }

  async findAll(companyId: string, projectId?: string) {
    const where: any = { company_id: companyId };
    if (projectId) where.project_id = projectId;

    return this.poRepo.find({
      where,
      relations: ['items', 'receipts', 'project'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const po = await this.poRepo.findOne({
      where: { id, company_id: companyId },
      relations: ['items', 'receipts', 'receipts.items', 'project'],
    });
    if (!po) {
      throw new NotFoundException(`Orden de compra ${id} no encontrada`);
    }
    return po;
  }

  async receiveDelivery(
    poId: string,
    dto: ReceiveDeliveryDto,
    companyId: string,
  ) {
    const po = await this.findOne(poId, companyId);

    if (
      po.status === PurchaseOrderStatus.CLOSED ||
      po.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'No se puede recibir material en una OC cerrada o cancelada',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const receiptItems: ReceiptItem[] = [];

      for (const itemDto of dto.items) {
        const poItem = po.items.find(
          (i) => i.id === itemDto.purchase_order_item_id,
        );
        if (!poItem) {
          throw new NotFoundException(
            `Ítem de OC ${itemDto.purchase_order_item_id} no encontrado`,
          );
        }

        const newTotalReceived =
          Number(poItem.quantity_received) + itemDto.quantity_received;

        if (newTotalReceived > Number(poItem.quantity_ordered) * 1.05) {
          throw new BadRequestException(
            `La cantidad recibida (${newTotalReceived}) supera en más del 5% ` +
              `lo ordenado (${poItem.quantity_ordered}) para "${poItem.description}"`,
          );
        }

        await manager.update(PurchaseOrderItem, poItem.id, {
          quantity_received: newTotalReceived,
        });

        const receiptItem = manager.create(ReceiptItem, {
          purchase_order_item_id: poItem.id,
          quantity_received: itemDto.quantity_received,
          notes: itemDto.notes,
        });
        receiptItems.push(receiptItem);
      }

      const receipt = manager.create(PurchaseOrderReceipt, {
        purchase_order_id: poId,
        received_by: dto.received_by,
        reception_date: new Date(dto.reception_date),
        guia_despacho_number: dto.guia_despacho_number,
        notes: dto.notes,
        photo_url: dto.photo_url,
        items: receiptItems,
      });

      const savedReceipt = await manager.save(PurchaseOrderReceipt, receipt);

      const updatedItems = await manager.find(PurchaseOrderItem, {
        where: { purchase_order_id: poId },
      });

      const allFullyReceived = updatedItems.every(
        (item) =>
          Number(item.quantity_received) >= Number(item.quantity_ordered),
      );
      const someReceived = updatedItems.some(
        (item) => Number(item.quantity_received) > 0,
      );

      let newStatus = po.status;
      if (allFullyReceived) {
        newStatus = PurchaseOrderStatus.FULLY_RECEIVED;
      } else if (someReceived) {
        newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }

      if (newStatus !== po.status) {
        await manager.update(PurchaseOrder, poId, { status: newStatus });
      }

      return savedReceipt;
    });
  }

  async matchInvoice(poId: string, dto: MatchInvoiceDto, companyId: string) {
    const po = await this.findOne(poId, companyId);

    if (
      po.status !== PurchaseOrderStatus.FULLY_RECEIVED &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        'No se puede vincular factura: la OC no tiene recepción registrada. ' +
          'El material debe ser recibido en terreno antes de validar la factura.',
      );
    }

    const invoice = await this.invoiceRepo.findOne({
      where: { id: dto.invoice_id, company_id: companyId },
    });
    if (!invoice) {
      throw new NotFoundException(`Factura ${dto.invoice_id} no encontrada`);
    }

    await this.poRepo.update(poId, {
      invoice_id: dto.invoice_id,
      status:
        po.status === PurchaseOrderStatus.FULLY_RECEIVED
          ? PurchaseOrderStatus.INVOICED
          : po.status,
    });

    await this.invoiceRepo.update(dto.invoice_id, {
      purchase_order_id: poId,
    });

    return {
      matched: true,
      purchase_order_id: poId,
      invoice_id: dto.invoice_id,
    };
  }

  async getMatchStatus(
    poId: string,
    companyId: string,
  ): Promise<ThreeWayMatchStatus> {
    const po = await this.findOne(poId, companyId);

    const totalOrdered = po.items.reduce(
      (sum, item) =>
        sum + Number(item.quantity_ordered) * Number(item.unit_price),
      0,
    );

    const totalReceived = po.items.reduce(
      (sum, item) =>
        sum + Number(item.quantity_received) * Number(item.unit_price),
      0,
    );

    const allFullyReceived = po.items.every(
      (item) => Number(item.quantity_received) >= Number(item.quantity_ordered),
    );
    const someReceived = po.items.some(
      (item) => Number(item.quantity_received) > 0,
    );

    const invoiced = !!po.invoice_id;

    let totalInvoiced = 0;
    if (po.invoice_id) {
      const invoice = await this.invoiceRepo.findOne({
        where: { id: po.invoice_id },
      });
      if (invoice) {
        totalInvoiced = Number(invoice.monto_total) || Number(invoice.amount);
      }
    }

    const receptionPercentage =
      totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

    return {
      purchase_order_id: po.id,
      po_number: po.po_number || '-',
      supplier_name: po.supplier_name,
      ordered: true,
      received: allFullyReceived,
      partially_received: someReceived && !allFullyReceived,
      invoiced,
      ready_for_payment: allFullyReceived && invoiced,
      total_ordered: totalOrdered,
      total_received: totalReceived,
      total_invoiced: totalInvoiced,
      reception_percentage: Math.round(receptionPercentage * 100) / 100,
    };
  }

  async getProjectMatchSummary(projectId: string, companyId: string) {
    const orders = await this.poRepo.find({
      where: { project_id: projectId, company_id: companyId },
      relations: ['items'],
    });

    const summary = {
      total_orders: orders.length,
      draft: orders.filter((o) => o.status === PurchaseOrderStatus.DRAFT)
        .length,
      sent: orders.filter((o) => o.status === PurchaseOrderStatus.SENT).length,
      partially_received: orders.filter(
        (o) => o.status === PurchaseOrderStatus.PARTIALLY_RECEIVED,
      ).length,
      fully_received: orders.filter(
        (o) => o.status === PurchaseOrderStatus.FULLY_RECEIVED,
      ).length,
      invoiced: orders.filter((o) => o.status === PurchaseOrderStatus.INVOICED)
        .length,
      closed: orders.filter((o) => o.status === PurchaseOrderStatus.CLOSED)
        .length,
      ready_for_payment: orders.filter(
        (o) =>
          o.status === PurchaseOrderStatus.INVOICED ||
          o.status === PurchaseOrderStatus.CLOSED,
      ).length,
      total_amount: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    };

    return summary;
  }
}
