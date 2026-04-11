import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './analytics-export.service';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsExportService: AnalyticsExportService,
  ) {}

  @Get('dashboard')
  async getDashboardSummary(@CurrentCompany() companyId: string) {
    return this.analyticsService.getDashboardSummary(companyId);
  }

  @Get('financial')
  async getFinancialSummary(@CurrentCompany() companyId: string) {
    return this.analyticsService.getFinancialSummary(companyId);
  }

  @Get('financial/:projectId')
  async getProjectFinancialDetails(
    @CurrentCompany() companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.analyticsService.getProjectFinancialDetails(
      companyId,
      projectId,
    );
  }

  @Get('physical')
  async getPhysicalProgress(@CurrentCompany() companyId: string) {
    return this.analyticsService.getPhysicalProgress(companyId);
  }

  @Get('physical/:projectId')
  async getProjectPhysicalDetails(
    @CurrentCompany() companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.analyticsService.getProjectPhysicalDetails(
      companyId,
      projectId,
    );
  }

  @Get('clashes')
  async getClashHealth(@CurrentCompany() companyId: string) {
    return this.analyticsService.getClashHealth(companyId);
  }

  @Get('clashes/:projectId')
  async getProjectClashHealth(
    @CurrentCompany() companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.analyticsService.getProjectClashHealth(companyId, projectId);
  }

  @Get('cashflow')
  async getCashflow(@CurrentCompany() companyId: string) {
    return this.analyticsService.getCashflow(companyId);
  }

  @Get('cashflow/:projectId')
  async getProjectCashflow(
    @CurrentCompany() companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.analyticsService.getProjectCashflow(companyId, projectId);
  }

  @Get('export/excel')
  async exportExcel(
    @CurrentCompany() companyId: string,
    @Query('company_name') companyName: string,
    @Query('project_id') projectId: string,
    @Res() res: Response,
  ) {
    const buffer =
      await this.analyticsExportService.generateExcelReport(
        companyId,
        companyName || 'BM Build Manage',
        projectId,
      );

    const filename = `reporte_bi_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
