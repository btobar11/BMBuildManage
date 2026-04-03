import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async logEvent(data: {
    company_id?: string;
    user_id?: string;
    entity_name: string;
    entity_id: string;
    action: AuditAction;
    old_value?: any;
    new_value?: any;
    description?: string;
  }) {
    const log = this.auditRepo.create(data);
    return this.auditRepo.save(log);
  }

  async getLogsForEntity(entityName: string, entityId: string) {
    return this.auditRepo.find({
      where: { entity_name: entityName, entity_id: entityId },
      order: { created_at: 'DESC' },
    });
  }
}
