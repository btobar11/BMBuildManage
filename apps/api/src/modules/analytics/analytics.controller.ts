import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './analytics-export.service';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsExportService: AnalyticsExportService,
  ) {}

  // =========================================================================
  // READ-ONLY ENDPOINTS - Admin, Engineer, Architect, SiteSupervisor, Foreman, Accounting
  // =========================================================================

  @Get('dashboard')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
  async getDashboardSummary(@CurrentCompany() companyId: string) {
    return this.analyticsService.getDashboardSummary(companyId);
  }

  @Get('financial')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
  async getFinancialSummary(@CurrentCompany() companyId: string) {
    return this.analyticsService.getFinancialSummary(companyId);
  }

  @Get('financial/:projectId')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
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
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
  )
  async getPhysicalProgress(@CurrentCompany() companyId: string) {
    return this.analyticsService.getPhysicalProgress(companyId);
  }

  @Get('physical/:projectId')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
  )
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
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  async getClashHealth(@CurrentCompany() companyId: string) {
    return this.analyticsService.getClashHealth(companyId);
  }

  @Get('clashes/:projectId')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  async getProjectClashHealth(
    @CurrentCompany() companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.analyticsService.getProjectClashHealth(companyId, projectId);
  }

  @Get('cashflow')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ACCOUNTING)
  async getCashflow(@CurrentCompany() companyId: string) {
    return this.analyticsService.getCashflow(companyId);
  }

  @Get('cashflow/:projectId')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ACCOUNTING)
  async getProjectCashflow(
    @CurrentCompany() companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.analyticsService.getProjectCashflow(companyId, projectId);
  }

  // =========================================================================
  // EXPORT ENDPOINTS - Admin, Engineer, Accounting only
  // =========================================================================

  @Get('export/excel')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ACCOUNTING)
  async exportExcel(
    @CurrentCompany() companyId: string,
    @Query('company_name') companyName: string,
    @Query('project_id') projectId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.analyticsExportService.generateExcelReport(
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
