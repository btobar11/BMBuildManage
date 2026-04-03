import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetExecutionLog } from './budget-execution-log.entity';
import { CreateExecutionLogDto } from './dto/create-execution-log.dto';
import { Item } from '../items/item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/audit-log.entity';

@Injectable()
export class ExecutionService {
  constructor(
    @InjectRepository(BudgetExecutionLog)
    private readonly logRepo: Repository<BudgetExecutionLog>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateExecutionLogDto, userId?: string) {
    const item = await this.itemRepo.findOne({ where: { id: dto.budget_item_id } });
    if (!item) throw new NotFoundException(`Budget item ${dto.budget_item_id} not found`);

    // 1. Threshold Validation (Business Rule #5)
    const currentExecuted = Number(item.quantity_executed) || 0;
    const newExecuted = currentExecuted + Number(dto.quantity_executed);
    const estimatedQty = Number(item.quantity) || 0;
    
    // Configurable threshold (e.g., 1.1 = 10% overage allowed)
    const threshold = 1.1; 
    if (newExecuted > (estimatedQty * threshold) && estimatedQty > 0) {
      throw new BadRequestException(
        `Error de validación: La cantidad ejecutada (${newExecuted}) supera el límite permitido del 10% sobre lo presupuestado (${estimatedQty}).`
      );
    }

    const log = this.logRepo.create(dto);
    const savedLog = await this.logRepo.save(log);

    // 2. Atomic Update of Item
    await this.itemRepo.update(item.id, {
      quantity_executed: newExecuted,
      real_cost: (Number(item.real_cost) || 0) + (Number(dto.real_cost) || 0),
    });

    await this.auditLogsService.logEvent({
      entity_name: 'BudgetExecutionLog',
      entity_id: savedLog.id,
      action: AuditAction.CREATE,
      user_id: userId,
      description: `Ejecución registrada para item ${item.name}: ${dto.quantity_executed} ${item.unit}`,
      new_value: savedLog,
    });

    return savedLog;
  }

  findByItem(budgetItemId: string) {
    return this.logRepo.find({
      where: { budget_item_id: budgetItemId },
      order: { date: 'DESC' },
    });
  }

  async findByBudget(budgetId: string) {
    // Join via budget_item → stage → budget
    return this.logRepo
      .createQueryBuilder('log')
      .innerJoin('log.budget_item', 'item')
      .innerJoin('item.stage', 'stage')
      .where('stage.budget_id = :budgetId', { budgetId })
      .orderBy('log.date', 'DESC')
      .getMany();
  }

  async remove(id: string) {
    const log = await this.logRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`Execution log ${id} not found`);
    await this.logRepo.remove(log);
    return { deleted: true };
  }
}
