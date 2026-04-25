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
  BadRequestException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { BudgetsService } from './budgets.service';
import { ExportService } from './export.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PDFExportService } from './pdf-export.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// ─── DTOs ─────────────────────────────────────────────────────────────────

interface BulkImportItemDto {
  stage_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  unit_price: number;
  position: number;
}

interface BulkImportBodyDto {
  items: BulkImportItemDto[];
}

// ─── Authenticated request type ────────────────────────────────────────────

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    company_id: string;
    role: string;
  };
}

// ─── Controller ────────────────────────────────────────────────────────────

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly exportService: ExportService,
    private readonly pdfExportService: PDFExportService,
  ) {}

  // ─── PDF Export ──────────────────────────────────────────────────────────

  @Get(':id/export/pdf')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
  async exportPdf(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const budget = await this.budgetsService.findOne(id, req.user?.company_id);
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

  // ─── CREATE ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  create(
    @Body() createBudgetDto: CreateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetsService.create(
      createBudgetDto,
      req.user?.id,
      req.user?.company_id,
    );
  }

  // ─── ACTIVATE ────────────────────────────────────────────────────────────

  @Post(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  setActive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetsService.setActiveVersion(
      id,
      req.user?.id,
      req.user?.company_id,
    );
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
  findAll(
    @Query('project_id') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetsService.findAllByProject(
      projectId,
      req.user?.company_id,
    );
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetsService.findOne(id, req.user?.company_id);
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────

  @Get('project/:projectId/summary')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.SITESUPERVISOR,
    UserRole.FOREMAN,
    UserRole.ACCOUNTING,
  )
  getSummary(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetsService.getSummary(projectId, req.user?.company_id);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetsService.update(
      id,
      updateBudgetDto,
      req.user?.id,
      req.user?.company_id,
    );
  }

  // ─── CREATE REVISION ──────────────────────────────────────────────────────
  // No manual try/catch: AllExceptionsFilter handles all unhandled errors.
  // Service throws typed HttpExceptions (NotFoundException, ForbiddenException)
  // which HttpExceptionFilter converts to structured JSON responses.

  @Post(':id/revision')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  createRevision(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetsService.createRevision(
      id,
      req.user?.id,
      req.user?.company_id,
    );
  }

  // ─── EXCEL EXPORT ─────────────────────────────────────────────────────────

  @Get(':id/export/excel')
  @Roles(
    UserRole.ADMIN,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
    UserRole.ACCOUNTING,
  )
  async exportExcel(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const budget = await this.budgetsService.findOne(id, req.user?.company_id);
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

  // ─── DELETE ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }

  // ─── BULK IMPORT ──────────────────────────────────────────────────────────
  // Single request → Postgres RPC → atomic ACID transaction.
  // If RPC not deployed, falls back to TypeORM transaction.

  @Post(':id/items/bulk')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT)
  bulkCreateItems(
    @Param('id') budgetId: string,
    @Body() body: BulkImportBodyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!Array.isArray(body?.items)) {
      throw new BadRequestException({
        code: 'BULK_INVALID_BODY',
        message: 'Request body must contain an "items" array',
      });
    }
    return this.budgetsService.bulkCreateItems(
      budgetId,
      body.items,
      req.user?.company_id,
    );
  }
}
