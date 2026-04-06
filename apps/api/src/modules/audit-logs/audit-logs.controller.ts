import { Controller, Get, Query, UseGuards, Req, Param } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Controller('audit-logs')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * GET /audit-logs?entity_name=Budget&entity_id=xxx
   * Returns audit trail for a specific entity.
   * Accessible by Admin and Accounting roles.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTING)
  async getAuditLogs(
    @Query('entity_name') entityName: string,
    @Query('entity_id') entityId: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    const companyId = req.user?.company_id;
    const take = Math.min(parseInt(limit) || 50, 200);

    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC')
      .take(take);

    if (entityName)
      qb.andWhere('log.entity_name = :entityName', { entityName });
    if (entityId) qb.andWhere('log.entity_id = :entityId', { entityId });
    if (companyId) qb.andWhere('log.company_id = :companyId', { companyId });

    return qb.getMany();
  }

  /**
   * GET /audit-logs/by-entity?entity_name=Budget&entity_id=xxx
   * Simpler endpoint for specific entity history.
   */
  @Get('by-entity')
  @Roles(
    UserRole.ADMIN,
    UserRole.ACCOUNTING,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
  )
  async getEntityHistory(
    @Query('entity_name') entityName: string,
    @Query('entity_id') entityId: string,
  ) {
    return this.auditLogsService.getLogsForEntity(entityName, entityId);
  }

  /**
   * GET /audit-logs/project/:projectId
   * Returns all logs related to a specific project.
   * Searches by project_id AND by entity_ids belonging to the project's budgets/stages/items.
   */
  @Get('project/:projectId')
  @Roles(
    UserRole.ADMIN,
    UserRole.ACCOUNTING,
    UserRole.ENGINEER,
    UserRole.ARCHITECT,
  )
  async getProjectLogs(
    @Param('projectId') projectId: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    const companyId = req.user?.company_id;
    const take = Math.min(parseInt(limit) || 100, 500);

    // Gather all entity IDs related to this project (budgets, stages, items)
    const relatedIds: string[] = [];

    try {
      // Get budget IDs
      const budgets = await this.auditRepo.manager.query(
        `SELECT id FROM budgets WHERE project_id = $1`,
        [projectId],
      );
      const budgetIds = budgets.map((b: any) => b.id);
      relatedIds.push(...budgetIds);

      if (budgetIds.length > 0) {
        // Get stage IDs
        const stages = await this.auditRepo.manager.query(
          `SELECT id FROM stages WHERE budget_id = ANY($1::uuid[])`,
          [budgetIds],
        );
        const stageIds = stages.map((s: any) => s.id);
        relatedIds.push(...stageIds);

        if (stageIds.length > 0) {
          // Get item IDs
          const items = await this.auditRepo.manager.query(
            `SELECT id FROM items WHERE stage_id = ANY($1::uuid[])`,
            [stageIds],
          );
          relatedIds.push(...items.map((i: any) => i.id));
        }
      }

      // Get expense IDs
      const expenses = await this.auditRepo.manager.query(
        `SELECT id FROM expenses WHERE project_id = $1`,
        [projectId],
      );
      relatedIds.push(...expenses.map((e: any) => e.id));
    } catch {
      // If any query fails, fall back to project_id filter only
    }

    const qb = this.auditRepo
      .createQueryBuilder('log')
      .where('log.company_id = :companyId', { companyId })
      .orderBy('log.created_at', 'DESC')
      .take(take);

    if (relatedIds.length > 0) {
      qb.andWhere(
        '(log.project_id = :projectId OR log.entity_id IN (:...relatedIds))',
        { projectId, relatedIds },
      );
    } else {
      qb.andWhere('log.project_id = :projectId', { projectId });
    }

    return qb.getMany();
  }
}
