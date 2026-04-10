import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { AIService } from './ai.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class NLPQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'El campo query es requerido' })
  query!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  budgetId?: string;
}

class ReportDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  type!: 'executive' | 'financial' | 'technical';
}

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('query')
  @UseGuards(SupabaseAuthGuard)
  async processQuery(@CurrentUser() user: any, @Body() dto: NLPQueryDto) {
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
