import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  // Lista de entidades que queremos auditar
  private auditedEntities = [
    'Item',
    'Budget',
    'Resource',
    'ApuTemplate',
    'Contingency',
    'WorkerPayment',
    'Expense',
    'WorkerAssignment',
    'BudgetExecutionLog',
  ];

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Called before entity insertion.
   */
  async afterInsert(event: InsertEvent<any>) {
    if (!event.entity || !event.metadata) return;
    const entityName = event.metadata.name;

    if (this.auditedEntities.includes(entityName)) {
      const log = this.auditRepo.create({
        entity_name: entityName,
        entity_id: event.entity.id,
        company_id: event.entity.company_id || null,
        project_id:
          event.entity.project_id || event.entity.budget?.project_id || null,
        action: AuditAction.CREATE,
        new_value: event.entity,
        description: `Created new ${entityName}: ${event.entity.name || event.entity.description || event.entity.id}`,
      });
      await this.auditRepo.save(log);
    }
  }

  /**
   * Called before entity update.
   */
  async afterUpdate(event: UpdateEvent<any>) {
    if (!event.entity || !event.metadata || !event.databaseEntity) return;
    const entityName = event.metadata.name;

    if (this.auditedEntities.includes(entityName)) {
      const log = this.auditRepo.create({
        entity_name: entityName,
        entity_id: event.databaseEntity.id,
        company_id:
          event.databaseEntity.company_id || event.entity.company_id || null,
        project_id:
          event.databaseEntity.project_id || event.entity.project_id || null,
        action: AuditAction.UPDATE,
        old_value: event.databaseEntity,
        new_value: event.entity,
        description: `Updated ${entityName}: ${event.databaseEntity.name || event.databaseEntity.description || event.databaseEntity.id}`,
      });
      await this.auditRepo.save(log);
    }
  }

  /**
   * Called before entity removal.
   */
  async beforeRemove(event: RemoveEvent<any>) {
    if (!event.entity || !event.metadata || !event.entityId) return;
    const entityName = event.metadata.name;

    if (this.auditedEntities.includes(entityName)) {
      const log = this.auditRepo.create({
        entity_name: entityName,
        entity_id: event.entityId,
        company_id: event.entity.company_id || null,
        project_id: event.entity.project_id || null,
        action: AuditAction.DELETE,
        old_value: event.entity,
        description: `Deleted ${entityName}: ${event.entity.name || event.entity.description || event.entityId}`,
      });
      await this.auditRepo.save(log);
    }
  }
}
