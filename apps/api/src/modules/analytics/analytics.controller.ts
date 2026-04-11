import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}
