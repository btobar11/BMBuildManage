import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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

class AnalyzeBudgetDto {
  @IsUUID()
  budgetId!: string;

  @IsOptional()
  @IsString()
  prompt?: string;
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
  async analyzeBudget(
    @CurrentUser() user: any,
    @Body('budgetId') budgetId: string,
    @Body('prompt') prompt?: string,
  ) {
    try {
      return await this.aiService.analyzeBudgetWithAI(budgetId, prompt);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al analizar presupuesto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('report')
  @UseGuards(SupabaseAuthGuard)
  async generateReport(@Body() dto: ReportDto) {
    return this.aiService.generateProjectReport(dto.projectId, dto.type);
  }

  @Get('status')
  @UseGuards(SupabaseAuthGuard)
  getAIStatus() {
    return {
      available: true,
      model: process.env.AI_MODEL || 'llama-3.1-70b-versatile',
      provider: 'groq',
    };
  }

  @Get('analyze/quality')
  @UseGuards(SupabaseAuthGuard)
  async analyzeQuality() {
    return { status: 'pending', message: 'AI module in development' };
  }

  @Get('analyze/resources')
  @UseGuards(SupabaseAuthGuard)
  async analyzeResources() {
    return { status: 'pending', message: 'AI module in development' };
  }

  @Get('analyze/summary')
  @UseGuards(SupabaseAuthGuard)
  async analyzeSummary() {
    return { status: 'pending', message: 'AI module in development' };
  }

  @Get('analyze/progress')
  @UseGuards(SupabaseAuthGuard)
  async analyzeProgress() {
    return { status: 'pending', message: 'AI module in development' };
  }

  @Get('analyze/clashes')
  @UseGuards(SupabaseAuthGuard)
  async analyzeClashes() {
    return { status: 'pending', message: 'AI module in development' };
  }

  @Get('analyze/costs')
  @UseGuards(SupabaseAuthGuard)
  async analyzeCosts() {
    return { status: 'pending', message: 'AI module in development' };
  }
}
