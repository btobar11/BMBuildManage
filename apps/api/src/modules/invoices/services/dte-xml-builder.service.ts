import { Injectable, BadRequestException } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { Invoice, DteType, InvoiceStatus } from '../invoice.entity';
import { InvoiceItem } from '../invoice-item.entity';

/**
 * DTE XML Builder Service
 *
 * Builds SII-compliant XML for Chilean Electronic Invoices (DTE).
 * @see https://www.sii.cl/factura_electronica/factura_ev.htm
 *
 * Supported Document Types:
 * - 33: Factura Afecta
 * - 34: Factura Exenta
 * - 61: Nota de Crédito
 * - 56: Nota de Débito
 */
@Injectable()
export class DteXmlBuilderService {
  private static readonly SII_VERSION = '1.0';
  private static readonly IVA_RATE = 19;

  /**
   * Build DTE XML from Invoice entity
   *
   * @throws BadRequestException if required fields are missing
   */
  buildDteXml(invoice: Invoice, items: InvoiceItem[]): string {
    // Validate required fields before building XML
    this.validateInvoice(invoice);

    // Build XML structure
    const root = this.buildDocument(invoice, items);

    // Convert to string
    return root.end({ prettyPrint: true, xmlDecl: true });
  }

  /**
   * Validate invoice required fields
   *
   * @throws BadRequestException if validation fails
   */
  private validateInvoice(invoice: Invoice): void {
    const errors: string[] = [];

    // Emisor (required)
    if (!invoice.rut_emisor) {
      errors.push('RUT del emisor es requerido (rut_emisor)');
    }
    if (!invoice.razon_social_emisor) {
      errors.push('Razón social del emisor es requerida (razon_social_emisor)');
    }
    if (!invoice.giro_emisor) {
      errors.push('Giro del emisor es requerido (giro_emisor)');
    }

    // Receptor (required for non-exempt)
    if (invoice.tipo_dte !== DteType.FACTURA_EXENTA && !invoice.rut_receptor) {
      errors.push('RUT del receptor es requerido (rut_receptor)');
    }

    // Dates
    if (!invoice.fecha_emision) {
      errors.push('Fecha de emisión es requerida (fecha_emision)');
    }

    // Folio (required when status is electronically signed)
    if (
      invoice.status === InvoiceStatus.ELECTRONICALLY_SIGNED &&
      !invoice.folio
    ) {
      errors.push('Folio es requerido para firma electrónica');
    }

    // Amounts
    if (!invoice.monto_total || invoice.monto_total <= 0) {
      errors.push('Monto total debe ser mayor a 0');
    }

    // IVA consistency
    if (invoice.tipo_dte === DteType.FACTURA_AFECTA) {
      const expectedIva = invoice.monto_neto * (invoice.tasa_iva / 100);
      const ivaTolerance = 1; // CLP tolerance

      if (Math.abs(invoice.monto_iva - expectedIva) > ivaTolerance) {
        errors.push(
          `IVA inconsistente: $${invoice.monto_iva} esperado ~$${expectedIva.toFixed(2)}`,
        );
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Error de validación DTE',
        errors,
      });
    }
  }

  /**
   * Build Document element
   */
  private buildDocument(invoice: Invoice, items: InvoiceItem[]): any {
    const tipo = invoice.tipo_dte || DteType.FACTURA_AFECTA;
    const folio = invoice.folio || '0';

    return create({
      DTE: {
        '@version': DteXmlBuilderService.SII_VERSION,
        Documento: {
          '@ID': `F${folio}T${tipo}`,
          Encabezado: this.buildEncabezado(invoice),
          Detalle: this.buildDetalle(items),
          Referencias: this.buildReferencias(invoice),
          Totales: this.buildTotales(invoice),
        },
      },
    });
  }

  /**
   * Build Encabezado (Header) section
   */
  private buildEncabezado(invoice: Invoice): any {
    const fechaEmision = this.formatDate(invoice.fecha_emision);
    const fechaVencimiento = invoice.fecha_vencimiento
      ? this.formatDate(invoice.fecha_vencimiento)
      : undefined;

    return {
      IdDoc: {
        TipoDTE: invoice.tipo_dte,
        Folio: invoice.folio,
        FchEmis: fechaEmision,
        FchVenc: fechaVencimiento,
      },
      Emisor: this.buildEmisor(invoice),
      Receptor: this.buildReceptor(invoice),
      Transporte: this.buildTransporte(invoice),
    };
  }

  /**
   * Build Emisor (Seller) section
   */
  private buildEmisor(invoice: Invoice): any {
    return {
      RUTEmisor: invoice.rut_emisor,
      RznSocEmisor: invoice.razon_social_emisor,
      GiroEmisor: invoice.giro_emisor,
      ActecoEmisor: invoice.actividad_economica_emisor,
      DirEmisor: invoice.direccion_emisor,
      CmnaEmisor: invoice.comuna_emisor,
    };
  }

  /**
   * Build Receptor (Buyer) section
   */
  private buildReceptor(invoice: Invoice): any {
    if (!invoice.rut_receptor) {
      return {
        // No receptor for some document types
      };
    }

    return {
      RUTRecep: invoice.rut_receptor,
      RznSocRecep: invoice.razon_social_receptor,
      GiroRecep: invoice.giro_receptor,
      DirRecep: invoice.direccion_receptor,
      CmnaRecep: invoice.comuna_receptor,
    };
  }

  /**
   * Build Transporte section (optional)
   */
  private buildTransporte(invoice: Invoice): any | undefined {
    // Return undefined if no transport data
    if (!invoice.direccion_receptor) {
      return undefined;
    }

    return {
      // Placeholder for transport details
      // Could be extended with carrier info
    };
  }

  /**
   * Build Detalle (Line items) section
   */
  private buildDetalle(items: InvoiceItem[]): any[] {
    if (!items || items.length === 0) {
      // At least one item required
      return [
        {
          NroLineDet: 1,
          CdgItem: { TpoCod: 'INT', VlrCod: '000' },
          NmbItem: 'Sin detalle especificar',
          QtyItem: 1,
          PrcItem: 0,
          MontoItem: 0,
        },
      ];
    }

    return items.map((item, index) => ({
      NroLineDet: index + 1,
      CdgItem: item.codigo
        ? {
            TpoCod: 'INT',
            VlrCod: item.codigo,
          }
        : undefined,
      NmbItem: item.nombre || item.descripcion || 'Item',
      DescItem: item.descripcion || undefined,
      QtyItem: item.cantidad || 1,
      UnmdItem: item.unidad || 'und',
      PrcItem: this.round(item.precio_unitario || 0, 6),
      DescuentoPct: item.descuento_porcentaje || undefined,
      DescuentoMonto: item.descuento_monto || undefined,
      MontoItem: this.round(item.monto_total || 0, 2),
    }));
  }

  /**
   * Build Referencias section
   */
  private buildReferencias(invoice: Invoice): any[] | undefined {
    if (!invoice.folio_referencia) {
      return undefined;
    }

    return [
      {
        NroRef: 1,
        FolioRef: invoice.folio_referencia,
        TpoDocRef: invoice.tipo_referencia,
        CodRef: invoice.motivo_referencia || '1',
        FchRef: invoice.fecha_emision
          ? this.formatDate(invoice.fecha_emision)
          : undefined,
      },
    ];
  }

  /**
   * Build Totales section
   */
  private buildTotales(invoice: Invoice): any {
    const totals: any = {
      MntTotal: this.round(invoice.monto_total || 0, 2),
    };

    // Add net amount for affected invoices
    if (invoice.tipo_dte === DteType.FACTURA_AFECTA) {
      totals.MntNeto = this.round(invoice.monto_neto || 0, 2);
      totals.TasaIVA = this.round(
        invoice.tasa_iva || DteXmlBuilderService.IVA_RATE,
        2,
      );
      totals.IVA = this.round(invoice.monto_iva || 0, 2);
    }

    // Add exempt amount
    if (invoice.monto_exento && invoice.monto_exento > 0) {
      totals.MntExe = this.round(invoice.monto_exento, 2);
    }

    // Add claimed VAT for some document types
    if (invoice.monto_iva_reclamado && invoice.monto_iva_reclamado > 0) {
      totals.IVARechazado = this.round(invoice.monto_iva_reclamado, 2);
    }

    return totals;
  }

  /**
   * Format date to SII format (YYYY-MM-DD)
   */
  private formatDate(date: Date | string): string {
    if (!date) {
      return '';
    }

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Round number to specified decimal places
   */
  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Format RUT to SII standard (12345678-9)
   */
  static formatRut(rut: string): string {
    if (!rut) {
      return '';
    }

    // Remove any existing formatting
    const clean = rut.replace(/[^0-9Kk]/g, '');

    if (clean.length < 2) {
      return clean;
    }

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    // Add thousands separator to body
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
  }

  /**
   * Validate RUT format (Chile)
   */
  static validateRut(rut: string): boolean {
    if (!rut) {
      return false;
    }

    const clean = rut.replace(/[^0-9Kk]/g, '').toUpperCase();

    if (clean.length < 2) {
      return false;
    }

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Calculate check digit
    let sum = 0;
    let factor = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }

    const calculatedDv = String(11 - (sum % 11));
    const expectedDv = calculatedDv === '10' ? 'K' : calculatedDv;

    return dv === expectedDv;
  }
}
