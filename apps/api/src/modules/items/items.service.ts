import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/audit-log.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  create(createItemDto: CreateItemDto) {
    const item = this.itemRepository.create(createItemDto);
    return this.itemRepository.save(item);
  }

  findAllByStage(stageId: string) {
    return this.itemRepository.find({ where: { stage_id: stageId } });
  }

  async findAllByProject(projectId: string, search?: string) {
    const query = this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.stage', 'stage')
      .innerJoin('stage.budget', 'budget')
      .where('budget.project_id = :projectId', { projectId })
      .andWhere('budget.is_active = :isActive', { isActive: true })
      .select([
        'item.id',
        'item.name',
        'item.unit',
        'item.quantity',
        'item.unit_cost',
        'item.unit_price',
        'stage.name',
      ])
      .orderBy('item.position', 'ASC');

    if (search) {
      query.andWhere('item.name ILIKE :search', { search: `%${search}%` });
    }

    const items = await query.getMany();

    // Add stage name to each item
    return items.map((item: any) => ({
      ...item,
      stage_name: item.stage?.name || 'Sin etapa',
    }));
  }

  async findOne(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    userId?: string,
    companyId?: string,
  ) {
    const item = await this.findOne(id);
    const oldValue = { ...item };
    this.itemRepository.merge(item, updateItemDto);
    const saved = await this.itemRepository.save(item);

    await this.auditLogsService.logEvent({
      company_id: companyId,
      entity_name: 'Item',
      entity_id: saved.id,
      action: AuditAction.UPDATE,
      old_value: oldValue,
      new_value: saved,
      user_id: userId,
      description: `Item actualizado: ${saved.name}`,
    });

    return saved;
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
    return { deleted: true };
  }
}
