import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { BudgetsService } from '../budgets/budgets.service';
import { FinancialService } from './financial.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly financialService: FinancialService,
  ) {}

  async exportBudgetToExcel(budgetId: string): Promise<Buffer> {
    const budget = await this.budgetsService.findOne(budgetId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BMBuildManage';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Presupuesto', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    // ─── Header styling helpers ───────────────────────────────────────
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    const subHeaderFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C4F7C' },
    };
    const stageFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };
    const totalFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCFE2FF' },
    };

    const boldWhite: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    };
    const boldDark: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FF1E3A5F' },
      size: 10,
    };

    // ─── Column widths ────────────────────────────────────────────────
    sheet.columns = [
      { key: 'cod', width: 10 },
      { key: 'desc', width: 50 },
      { key: 'qty', width: 12 },
      { key: 'unit', width: 10 },
      { key: 'unitCost', width: 16 },
      { key: 'total', width: 18 },
    ];

    // ─── Title block ─────────────────────────────────────────────────
    const projectName = budget.project?.name || 'Proyecto';
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'PRESUPUESTO DE OBRA';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = headerFill;
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:F2');
    const projCell = sheet.getCell('A2');
    projCell.value = projectName;
    projCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    projCell.alignment = { horizontal: 'center', vertical: 'middle' };
    projCell.fill = headerFill;
    sheet.getRow(2).height = 22;

    // Meta info row
    const dateStr = new Date().toLocaleDateString('es-CL');
    sheet.mergeCells('A3:C3');
    sheet.getCell('A3').value = `Fecha: ${dateStr}`;
    sheet.getCell('A3').font = { size: 9 };
    sheet.mergeCells('D3:F3');
    sheet.getCell('D3').value = `Versión: ${budget.version}`;
    sheet.getCell('D3').font = { size: 9 };
    sheet.getRow(3).height = 16;

    // Empty separator
    sheet.getRow(4).height = 8;

    // ─── Column headers ───────────────────────────────────────────────
    const headerRow = sheet.addRow([
      'Ítem',
      'Descripción',
      'Cantidad',
      'Unidad',
      'P. Unitario',
      'Total Venta',
    ]);
    headerRow.eachCell((cell) => {
      cell.font = boldWhite;
      cell.fill = subHeaderFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF1E3A5F' } },
      };
    });
    headerRow.height = 20;

    // ─── Stages and items ─────────────────────────────────────────────
    let grandTotal = 0;
    let itemNum = 1;

    const stages = budget.stages || [];
    for (let si = 0; si < stages.length; si++) {
      const stage = stages[si];
      const stageRow = sheet.addRow([`${si + 1}.`, stage.name, '', '', '', '']);
      sheet.mergeCells(`B${stageRow.number}:F${stageRow.number}`);
      stageRow.getCell(1).font = boldDark;
      stageRow.getCell(2).font = boldDark;
      stageRow.eachCell((cell) => {
        cell.fill = stageFill;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        };
      });
      stageRow.height = 18;

      let stagePrice = 0;
      const items = stage.items || [];
      for (let ii = 0; ii < items.length; ii++) {
        const item = items[ii];
        const qty = Number(item.quantity) || 0;
        const up = Number(item.unit_price) || 0;
        const total = qty * up;
        stagePrice += total;

        const itemRow = sheet.addRow([
          `${si + 1}.${ii + 1}`,
          item.name,
          qty,
          item.unit || '',
          up,
          total,
        ]);
        itemRow.getCell(3).numFmt = '#,##0.000';
        itemRow.getCell(5).numFmt = '$#,##0';
        itemRow.getCell(6).numFmt = '$#,##0';
        itemRow.getCell(6).font = { bold: true };
        itemNum++;
      }

      // Stage subtotal
      const subtotalRow = sheet.addRow([
        '',
        `Subtotal Venta ${stage.name}`,
        '',
        '',
        '',
        stagePrice,
      ]);
      sheet.mergeCells(`B${subtotalRow.number}:E${subtotalRow.number}`);
      subtotalRow.getCell(2).font = {
        bold: true,
        italic: true,
        color: { argb: 'FF1E3A5F' },
      };
      subtotalRow.getCell(6).numFmt = '$#,##0';
      subtotalRow.getCell(6).font = { bold: true, color: { argb: 'FF1E3A5F' } };
      subtotalRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F5FF' },
        };
      });
      subtotalRow.height = 16;

      grandTotal += stagePrice;
    }

    // ─── Grand total row ─────────────────────────────────────────────
    const estCost = Number(budget.total_estimated_cost) || 0;
    const estPrice = Number(budget.total_estimated_price) || 0;

    sheet.addRow([]);
    const totalRow = sheet.addRow([
      '',
      'TOTAL ESTIMADO DE COSTO (Directo)',
      '',
      '',
      '',
      estCost,
    ]);
    sheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
    totalRow.getCell(1).font = {
      bold: true,
      size: 12,
      color: { argb: 'FF1E3A5F' },
    };
    totalRow.getCell(1).alignment = { horizontal: 'right' };
    totalRow.getCell(6).numFmt = '$#,##0';
    totalRow.getCell(6).font = {
      bold: true,
      size: 12,
      color: { argb: 'FF1E3A5F' },
    };
    totalRow.eachCell((cell) => {
      cell.fill = totalFill;
    });
    totalRow.height = 22;

    // Client price row
    const priceRow = sheet.addRow([
      '',
      'PRECIO TOTAL AL CLIENTE (Neto)',
      '',
      '',
      '',
      estPrice,
    ]);
    sheet.mergeCells(`A${priceRow.number}:E${priceRow.number}`);
    priceRow.getCell(1).font = {
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' },
    };
    priceRow.getCell(1).alignment = { horizontal: 'right' };
    priceRow.getCell(6).numFmt = '$#,##0';
    priceRow.getCell(6).font = {
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' },
    };
    priceRow.eachCell((cell) => {
      cell.fill = headerFill;
    });
    priceRow.height = 22;

    // Margin
    const profit = estPrice - estCost;
    const margin = estPrice > 0 ? Math.round((profit / estPrice) * 100) : 0;
    const marginRow = sheet.addRow([
      '',
      `Margen de utilidad esperado: ${margin}%`,
      '',
      '',
      '',
      profit,
    ]);
    sheet.mergeCells(`A${marginRow.number}:E${marginRow.number}`);
    marginRow.getCell(1).font = { italic: true, size: 10 };
    marginRow.getCell(6).numFmt = '$#,##0';
    marginRow.height = 16;

    // ─── Footer note ─────────────────────────────────────────────────
    sheet.addRow([]);
    const footerRow = sheet.addRow([
      '',
      'Generado por BMBuildManage · Presupuesto preliminar · Sujeto a modificaciones',
    ]);
    sheet.mergeCells(`B${footerRow.number}:F${footerRow.number}`);
    footerRow.getCell(2).font = {
      italic: true,
      size: 8,
      color: { argb: 'FF999999' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
