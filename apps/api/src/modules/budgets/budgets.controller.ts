import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  Req,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BudgetsService } from './budgets.service';
import { ExportService } from './export.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PDFExportService } from './pdf-export.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('budgets')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly exportService: ExportService,
    private readonly pdfExportService: PDFExportService,
  ) {}

  @Get(':id/export/pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const budget = await this.budgetsService.findOne(id);
    const projectName = budget.project?.name || 'presupuesto';
    const safeName = projectName.replace(/[^a-zA-Z0-9_\-áéíóú]/g, '_');

    const buffer = await this.pdfExportService.generateBudgetPDF(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Presupuesto_${safeName}_v${budget.version}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  create(@Body() createBudgetDto: CreateBudgetDto, @Req() req: any) {
    return this.budgetsService.create(createBudgetDto, req.user?.id);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  setActive(@Param('id') id: string, @Req() req: any) {
    return this.budgetsService.setActiveVersion(id, req.user?.id);
  }

  @Get()
  findAll(@Query('project_id') projectId: string) {
    return this.budgetsService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  @Get('project/:projectId/summary')
  getSummary(@Param('projectId') projectId: string) {
    return this.budgetsService.getSummary(projectId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: any,
  ) {
    return this.budgetsService.update(id, updateBudgetDto, req.user?.id);
  }

  @Post(':id/revision')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  async createRevision(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.budgetsService.createRevision(
        id,
        req.user?.id,
        req.user?.company_id,
      );
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message + ' \n ' + e.stack : JSON.stringify(e);
      throw new HttpException({ error: errorMsg }, 500);
    }
  }

  @Get(':id/export/excel')
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    const budget = await this.budgetsService.findOne(id);
    const projectName = budget.project?.name || 'presupuesto';
    const safeName = projectName.replace(/[^a-zA-Z0-9_\-áéíóú]/g, '_');

    const buffer = await this.exportService.exportBudgetToExcel(id);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Presupuesto_${safeName}_v${budget.version}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }

  @Post(':id/items/bulk')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  bulkCreateItems(
    @Param('id') budgetId: string,
    @Body()
    body: {
      items: Array<{
        stage_id: string;
        name: string;
        quantity: number;
        unit: string;
        unit_cost: number;
        unit_price: number;
        position: number;
      }>;
    },
  ) {
    return this.budgetsService.bulkCreateItems(budgetId, body.items);
  }
}
