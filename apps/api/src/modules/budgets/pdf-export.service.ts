import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { BudgetsService } from './budgets.service';

@Injectable()
export class PDFExportService {
  constructor(private readonly budgetsService: BudgetsService) {}

  async generateBudgetPDF(budgetId: string): Promise<Buffer> {
    const budget = await this.budgetsService.findOne(budgetId);
    const projectName = budget.project?.name || 'Proyecto Sin Nombre';
    const company = budget.project?.company;

    let logoBuffer: Buffer | null = null;
    if (company?.logo_url) {
      try {
        const fetchRes = await fetch(company.logo_url);
        if (fetchRes.ok) {
          logoBuffer = Buffer.from(await fetchRes.arrayBuffer());
        }
      } catch (error) {
        console.warn('Could not fetch logo for PDF', error);
      }
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // 1. HEADER
      this.generateHeader(doc, company, logoBuffer);

      // 2. PROJECT INFO
      this.generateProjectInfo(doc, budget, projectName);

      // 3. FINANCIAL SUMMARY
      this.generateFinancialSummary(doc, budget);

      // 4. BUDGET TABLE
      this.generateBudgetTable(doc, budget);

      // 5. BREAKDOWN BY TYPE
      this.generateBreakdownByType(doc, budget);

      // 6. TERMS AND CONDITIONS
      this.generateTerms(doc);

      // 5. SIGNATURE BLOCKS
      const clientName = (budget as any).project?.client?.name || 'Cliente';
      this.generateSignatures(doc, company, clientName);

      // 6. FOOTER
      this.generateFooter(doc);

      doc.end();
    });
  }

  private generateHeader(
    doc: PDFKit.PDFDocument,
    company: any,
    logoBuffer: Buffer | null,
  ) {
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 45, { height: 50 });
      } catch (e) {
        doc
          .fillColor('#444444')
          .fontSize(20)
          .text(company?.name || 'BMBuildManage', 50, 45);
      }
    } else {
      doc
        .fillColor('#444444')
        .fontSize(20)
        .text(company?.name || 'BMBuildManage', 50, 45);
    }

    doc
      .fillColor('#444444')
      .fontSize(10)
      .text(company?.tax_id || '', 50, 100)
      .text(company?.address || '', 50, 110)
      .text(company?.email || '', 50, 120)
      .text(company?.phone || '', 50, 130)
      .moveDown();

    doc.lineCap('butt').moveTo(50, 150).lineTo(550, 150).stroke('#cccccc');
  }

  private generateProjectInfo(
    doc: PDFKit.PDFDocument,
    budget: any,
    projectName: string,
  ) {
    doc
      .fillColor('#1e3a5f')
      .fontSize(16)
      .text('PRESUPUESTO DE OBRA', 50, 165, { align: 'center' })
      .moveDown(0.5);

    doc
      .fillColor('#333333')
      .fontSize(12)
      .text(`Proyecto: ${projectName}`, 50, 195)
      .text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 50, 210)
      .text(`Versión: ${budget.version}`, 50, 225, { align: 'right' })
      .moveDown();
  }

  private generateFinancialSummary(doc: PDFKit.PDFDocument, budget: any) {
    let y = 260;

    doc.fillColor('#1e3a5f').fontSize(12).font('Helvetica-Bold');
    doc.text('RESUMEN FINANCIERO', 50, y);
    y += 20;

    const totalCost = Number(budget.total_estimated_cost) || 0;
    const totalPrice = Number(budget.total_estimated_price) || 0;
    const professionalFee = budget.professional_fee_percentage || 10;
    const utility = budget.estimated_utility || 15;
    const profit = totalPrice - totalCost;
    const margin = totalPrice > 0 ? Math.round((profit / totalPrice) * 100) : 0;

    const summaryData = [
      { label: 'Costo Total Obra:', value: this.formatCurrency(totalCost) },
      { label: 'Honorarios Profesionales:', value: `${professionalFee}%` },
      { label: 'Margen Utilidad:', value: `${utility}%` },
      { label: '', value: '' },
      {
        label: 'PRECIO VENTA NETO:',
        value: this.formatCurrency(totalPrice),
        bold: true,
      },
      {
        label: 'Utilidad Proyecto:',
        value: this.formatCurrency(profit),
        highlight: margin < 20,
      },
    ];

    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    for (const row of summaryData) {
      if (row.bold) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a5f');
      } else if (row.highlight) {
        doc.font('Helvetica').fontSize(10).fillColor('#e74c3c');
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#333333');
      }
      doc.text(row.label, 50, y);
      const valueX = row.bold ? 450 : 350;
      doc.text(row.value, valueX, y, { align: 'right', width: 150 });
      y += 15;
    }

    doc.font('Helvetica');
  }

  private generateBreakdownByType(doc: PDFKit.PDFDocument, budget: any) {
    let y = (doc as any).y + 20;
    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    const stages = budget.stages || [];
    const byType: Record<string, number> = {
      material: 0,
      labor: 0,
      machinery: 0,
      subcontract: 0,
    };
    const costByType: Record<string, number> = {
      material: 0,
      labor: 0,
      machinery: 0,
      subcontract: 0,
    };

    for (const stage of stages) {
      for (const item of stage.items || []) {
        const total = (item.quantity || 0) * (item.unit_price || 0);
        const cost =
          (item.quantity || 0) * (item.unit_cost || item.unit_price || 0);
        const type = item.item_type || 'material';
        if (byType[type] !== undefined) {
          byType[type] = (byType[type] || 0) + total;
          costByType[type] = (costByType[type] || 0) + cost;
        }
      }
    }

    const typeLabels: Record<string, string> = {
      material: 'Materiales',
      labor: 'Mano de Obra',
      machinery: 'Equipos',
      subcontract: 'Subcontratos',
    };

    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold');
    doc.text('RESUMEN POR TIPO', 50, y);
    y += 20;

    const total = Object.values(byType).reduce((a, b) => a + b, 0) || 1;

    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    for (const [type, value] of Object.entries(byType)) {
      const cost = costByType[type] || 0;
      const profit = value - cost;
      const percentage = Math.round((value / total) * 100);
      const typeMargin = value > 0 ? Math.round((profit / value) * 100) : 0;

      doc.fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text(typeLabels[type] || type, 50, y);
      doc.font('Helvetica');
      doc.text(`${percentage}%`, 180, y, { width: 40, align: 'right' });
      doc.text(this.formatCurrency(value), 280, y, {
        width: 80,
        align: 'right',
      });
      doc.text(this.formatCurrency(profit), 380, y, {
        width: 70,
        align: 'right',
      });
      doc.text(`${typeMargin}%`, 460, y, { width: 40, align: 'right' });
      y += 14;
    }

    y += 5;
    doc.lineCap('butt').moveTo(50, y).lineTo(550, y).stroke('#cccccc');
    y += 15;

    doc.font('Helvetica-Bold').fillColor('#1e3a5f');
    doc.text('TOTAL', 50, y);
    doc.text('100%', 180, y, { width: 40, align: 'right' });
    doc.text(this.formatCurrency(total), 280, y, { width: 80, align: 'right' });
    const totalProfit =
      Object.values(byType).reduce((a, b) => a + b, 0) -
      Object.values(costByType).reduce((a, b) => a + b, 0);
    doc.text(this.formatCurrency(totalProfit), 380, y, {
      width: 70,
      align: 'right',
    });
    const totalMargin = total > 0 ? Math.round((totalProfit / total) * 100) : 0;
    doc.text(`${totalMargin}%`, 460, y, { width: 40, align: 'right' });
  }

  private generateBudgetTable(doc: PDFKit.PDFDocument, budget: any) {
    let y = 255;

    // Table Header
    doc.fillColor('#1e3a5f').fontSize(10);
    this.generateTableRow(
      doc,
      y,
      'Item',
      'Descripción',
      'Unid',
      'Cant',
      'P. Unit',
      'Total',
    );
    this.generateHr(doc, y + 15);
    y += 20;

    const stages = budget.stages || [];
    for (const stage of stages) {
      // Stage Header
      doc.fillColor('#2c4f7c').font('Helvetica-Bold').fontSize(10);
      doc.text(stage.name.toUpperCase(), 50, y);
      y += 15;
      doc.font('Helvetica').fillColor('#333333');

      let stageTotal = 0;
      for (const item of stage.items) {
        const total = (item.quantity || 0) * (item.unit_price || 0);
        stageTotal += total;

        // Check page overflow
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        this.generateTableRow(
          doc,
          y,
          '',
          item.name,
          item.unit || '-',
          item.quantity?.toString() || '0',
          this.formatCurrency(item.unit_price || 0),
          this.formatCurrency(total),
        );
        y += 15;
      }

      // Stage Subtotal
      doc.font('Helvetica-Bold');
      this.generateTableRow(
        doc,
        y,
        '',
        `Subtotal ${stage.name}`,
        '',
        '',
        '',
        this.formatCurrency(stageTotal),
      );
      y += 20;
      this.generateHr(doc, y - 5);
      doc.font('Helvetica');
    }

    // Totals Block
    y += 10;
    if (y > 700) (doc.addPage(), (y = 50));

    const totalPrice = Number(budget.total_estimated_price) || 0;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f');
    doc.text('RESUMEN GENERAL', 350, y);
    y += 20;

    doc.fillColor('#000000').fontSize(12);
    doc.text('TOTAL NETO CLIENTE:', 350, y);
    doc.text(this.formatCurrency(totalPrice), 480, y, {
      align: 'right',
      width: 70,
    });
    y += 20;
  }

  private generateTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    item: string,
    description: string,
    unit: string,
    quantity: string,
    price: string,
    total: string,
  ) {
    doc
      .text(item, 50, y)
      .text(description.substring(0, 45), 80, y)
      .text(unit, 300, y, { width: 30, align: 'center' })
      .text(quantity, 340, y, { width: 40, align: 'right' })
      .text(price, 390, y, { width: 70, align: 'right' })
      .text(total, 470, y, { width: 80, align: 'right' });
  }

  private generateHr(doc: PDFKit.PDFDocument, y: number) {
    doc
      .strokeColor('#eeeeee')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  private generateFooter(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text(
        'Este documento es una representación oficial generada por BMBuildManage. Sujeto a términos y condiciones del contrato.',
        50,
        780,
        { align: 'center', width: 500 },
      );
  }

  private generateTerms(doc: PDFKit.PDFDocument) {
    let y = (doc as any).y + 30;
    if (y > 600) {
      doc.addPage();
      y = 50;
    }
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1e3a5f')
      .text('TÉRMINOS Y CONDICIONES', 50, y);
    y += 15;
    doc.fontSize(8).font('Helvetica').fillColor('#444444');
    const terms = [
      '1. Validez de la oferta: 15 días corridos.',
      '2. Forma de pago: 50% anticipo, resto contra avance semanal.',
      '3. Plazos: A convenir tras el primer pago.',
      '4. Exclusiones: Permisos municipales no incluidos.',
      '5. Modificaciones: Se valorizarán como adicionales.',
    ];
    terms.forEach((t) => {
      doc.text(t, 50, y);
      y += 12;
    });
  }

  private generateSignatures(
    doc: PDFKit.PDFDocument,
    company: any,
    clientName: string,
  ) {
    let y = (doc as any).y + 60;
    if (y > 700) {
      doc.addPage();
      y = 80;
    }
    doc
      .strokeColor('#333333')
      .lineWidth(1)
      .moveTo(70, y)
      .lineTo(230, y)
      .stroke();
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(company?.name || 'CONSTRUCTORA', 70, y + 5, {
        width: 160,
        align: 'center',
      });
    doc
      .strokeColor('#333333')
      .lineWidth(1)
      .moveTo(360, y)
      .lineTo(520, y)
      .stroke();
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(clientName, 360, y + 5, { width: 160, align: 'center' });
  }
}
