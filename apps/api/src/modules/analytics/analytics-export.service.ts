import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import ExcelJS from 'exceljs';

interface FinancialRow {
  project_id: string;
  project_name: string;
  total_budgeted: number;
  total_spent: number;
  variance: number;
  percent_executed: number;
  material_budgeted: number;
  labor_budgeted: number;
  equipment_budgeted: number;
  material_spent: number;
  labor_spent: number;
  equipment_spent: number;
  calculated_at: Date;
}

interface ClashRow {
  project_id: string;
  total_clashes: number;
  pending_clashes: number;
  accepted_clashes: number;
  resolved_clashes: number;
  ignored_clashes: number;
  resolution_rate_percent: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

@Injectable()
export class AnalyticsExportService {
  constructor(private readonly dataSource: DataSource) {}

  async generateExcelReport(
    companyId: string,
    companyName: string,
    projectId?: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = companyName;
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A5F' },
      },
      alignment: { horizontal: 'center' as const },
      border: {
        top: { style: 'thin' as const, color: { argb: 'FF000000' } },
        left: { style: 'thin' as const, color: { argb: 'FF000000' } },
        right: { style: 'thin' as const, color: { argb: 'FF000000' } },
        bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
      },
    };

    const currencyStyle: Partial<ExcelJS.Style> = {
      numFmt: '$#,##0.00',
      alignment: { horizontal: 'right' as const },
    };

    const percentStyle: Partial<ExcelJS.Style> = {
      numFmt: '0.00"%"',
      alignment: { horizontal: 'right' as const },
    };

    const dateStyle: Partial<ExcelJS.Style> = {
      numFmt: 'yyyy-mm-dd hh:mm:ss',
      alignment: { horizontal: 'center' as const },
    };

    const metadataSheet = workbook.addWorksheet('Metadatos');
    metadataSheet.getCell('A1').value = 'REPORTE EJECUTIVO BI';
    metadataSheet.getCell('A1').font = {
      bold: true,
      size: 16,
      color: { argb: 'FF1E3A5F' },
    };
    metadataSheet.getCell('A2').value = 'Empresa:';
    metadataSheet.getCell('B2').value = companyName;
    metadataSheet.getCell('A3').value = 'Fecha de Generación:';
    metadataSheet.getCell('B3').value = new Date();
    metadataSheet.getCell('B3').numFmt = 'yyyy-mm-dd hh:mm:ss';
    metadataSheet.getCell('A4').value = 'Tipo de Reporte:';
    metadataSheet.getCell('B4').value = projectId
      ? 'Detalle por Proyecto'
      : 'Resumen General';
    metadataSheet.getColumn(1).width = 20;
    metadataSheet.getColumn(2).width = 30;

    const financialData = await this.getFinancialData(companyId, projectId);
    const financialSheet = workbook.addWorksheet('Presupuesto vs Real');
    financialSheet.mergeCells('A1:K1');
    financialSheet.getCell('A1').value = 'Curva S - Presupuesto vs Gasto Real';
    financialSheet.getCell('A1').font = { bold: true, size: 14 };
    financialSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    financialSheet.getCell('A1').font = {
      bold: true,
      size: 14,
      color: { argb: 'FFFFFFFF' },
    };

    const fHeaders = [
      'Proyecto',
      'Presupuesto',
      'Gasto Real',
      'Variación',
      '% Ejecución',
      'Materiales Pptdo',
      'Mano Obra Pptdo',
      'Equipos Pptdo',
      'Materiales Real',
      'Mano Obra Real',
      'Equipos Real',
      'Fecha Cálculo',
    ];
    fHeaders.forEach((header, index) => {
      const cell = financialSheet.getCell(3, index + 1);
      cell.value = header;
      Object.assign(cell, headerStyle);
    });

    financialData.forEach((row: FinancialRow, rowIndex: number) => {
      const rowNum = rowIndex + 4;
      financialSheet.getCell(rowNum, 1).value = row.project_name;
      financialSheet.getCell(rowNum, 2).value = Number(row.total_budgeted);
      financialSheet.getCell(rowNum, 3).value = Number(row.total_spent);
      financialSheet.getCell(rowNum, 4).value = Number(row.variance);
      financialSheet.getCell(rowNum, 5).value =
        Number(row.percent_executed) / 100;
      financialSheet.getCell(rowNum, 6).value = Number(row.material_budgeted);
      financialSheet.getCell(rowNum, 7).value = Number(row.labor_budgeted);
      financialSheet.getCell(rowNum, 8).value = Number(row.equipment_budgeted);
      financialSheet.getCell(rowNum, 9).value = Number(row.material_spent);
      financialSheet.getCell(rowNum, 10).value = Number(row.labor_spent);
      financialSheet.getCell(rowNum, 11).value = Number(row.equipment_spent);
      financialSheet.getCell(rowNum, 12).value = new Date(row.calculated_at);

      for (let col = 2; col <= 4; col++) {
        Object.assign(financialSheet.getCell(rowNum, col), currencyStyle);
      }
      Object.assign(financialSheet.getCell(rowNum, 5), percentStyle);
      Object.assign(financialSheet.getCell(rowNum, 12), dateStyle);
    });

    for (let colNum = 1; colNum <= 12; colNum++) {
      financialSheet.getColumn(colNum).width = 18;
    }

    const clashData = await this.getClashData(companyId, projectId);
    const clashSheet = workbook.addWorksheet('Colisiones');
    clashSheet.mergeCells('A1:J1');
    clashSheet.getCell('A1').value = 'Resumen de Colisiones BIM';
    clashSheet.getCell('A1').font = { bold: true, size: 14 };
    clashSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    clashSheet.getCell('A1').font = {
      bold: true,
      size: 14,
      color: { argb: 'FFFFFFFF' },
    };

    const cHeaders = [
      'Proyecto',
      'Total',
      'Pendientes',
      'Aceptadas',
      'Resueltas',
      'Ignoradas',
      '% Resolución',
      'Críticas',
      'Altas',
      'Medias',
      'Bajas',
    ];
    cHeaders.forEach((header, index) => {
      const cell = clashSheet.getCell(3, index + 1);
      cell.value = header;
      Object.assign(cell, headerStyle);
    });

    clashData.forEach((row: ClashRow, rowIndex: number) => {
      const rowNum = rowIndex + 4;
      clashSheet.getCell(rowNum, 1).value = row.project_id;
      clashSheet.getCell(rowNum, 2).value = Number(row.total_clashes);
      clashSheet.getCell(rowNum, 3).value = Number(row.pending_clashes);
      clashSheet.getCell(rowNum, 4).value = Number(row.accepted_clashes);
      clashSheet.getCell(rowNum, 5).value = Number(row.resolved_clashes);
      clashSheet.getCell(rowNum, 6).value = Number(row.ignored_clashes);
      clashSheet.getCell(rowNum, 7).value =
        Number(row.resolution_rate_percent) / 100;
      clashSheet.getCell(rowNum, 8).value = Number(row.critical_count);
      clashSheet.getCell(rowNum, 9).value = Number(row.high_count);
      clashSheet.getCell(rowNum, 10).value = Number(row.medium_count);
      clashSheet.getCell(rowNum, 11).value = Number(row.low_count);

      Object.assign(clashSheet.getCell(rowNum, 7), percentStyle);
    });

    for (let colNum = 1; colNum <= 11; colNum++) {
      clashSheet.getColumn(colNum).width = 15;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  private async getFinancialData(
    companyId: string,
    projectId?: string,
  ): Promise<FinancialRow[]> {
    let whereClause = 'WHERE company_id = $1';
    const params: string[] = [companyId];

    if (projectId) {
      whereClause += ' AND project_id = $2';
      params.push(projectId);
    }

    const query = `
      SELECT 
        project_id,
        project_name,
        total_budgeted,
        total_spent,
        variance,
        percent_executed,
        material_budgeted,
        labor_budgeted,
        equipment_budgeted,
        material_spent,
        labor_spent,
        equipment_spent,
        calculated_at
      FROM bi_financial_summary
      ${whereClause}
      ORDER BY project_name ASC
    `;

    return this.dataSource.query(query, params);
  }

  private async getClashData(
    companyId: string,
    projectId?: string,
  ): Promise<ClashRow[]> {
    let whereClause = 'WHERE company_id = $1';
    const params: string[] = [companyId];

    if (projectId) {
      whereClause += ' AND project_id = $2';
      params.push(projectId);
    }

    const query = `
      SELECT 
        project_id,
        total_clashes,
        pending_clashes,
        accepted_clashes,
        resolved_clashes,
        ignored_clashes,
        resolution_rate_percent,
        critical_count,
        high_count,
        medium_count,
        low_count
      FROM bi_clash_health
      ${whereClause}
      ORDER BY total_clashes DESC
    `;

    return this.dataSource.query(query, params);
  }
}
