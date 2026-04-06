import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class NLPQueryDto {
  query: string;
  projectId?: string;
  budgetId?: string;
}

class ReportDto {
  projectId: string;
  type: 'executive' | 'financial' | 'technical';
}

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('query')
  @UseGuards(SupabaseAuthGuard)
  async processQuery(
    @CurrentUser() user: any,
    @Body() dto: NLPQueryDto,
  ) {
    const companyId = user.company_id;
    return this.aiService.processNaturalLanguageQuery(
      user.id,
      companyId,
      dto.query,
      { projectId: dto.projectId, budgetId: dto.budgetId },
    );
  }

  @Post('recommendations')
  @UseGuards(SupabaseAuthGuard)
  async getRecommendations(
    @CurrentUser() user: any,
    @Body('projectId') projectId?: string,
  ) {
    return this.aiService.generateRecommendations(user.company_id, projectId);
  }

  @Post('predict')
  @UseGuards(SupabaseAuthGuard)
  async predictOutcome(
    @CurrentUser() user: any,
    @Body('projectId') projectId?: string,
  ) {
    return this.aiService.predictProjectOutcome(user.company_id, projectId);
  }

  @Post('analyze-budget')
  @UseGuards(SupabaseAuthGuard)
  async analyzeBudget(@Body('budgetId') budgetId: string) {
    return this.aiService.analyzeBudgetDeviation(budgetId);
  }

  @Post('report')
  @UseGuards(SupabaseAuthGuard)
  async generateReport(@Body() dto: ReportDto) {
    return this.aiService.generateProjectReport(dto.projectId, dto.type);
  }
}