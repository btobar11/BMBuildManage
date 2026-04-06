import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PunchItem, PunchItemStatus } from './punch-item.entity';

@Injectable()
export class PunchListService {
  constructor(
    @InjectRepository(PunchItem)
    private punchItemRepository: Repository<PunchItem>,
  ) {}

  async create(data: Partial<PunchItem>): Promise<PunchItem> {
    const item = this.punchItemRepository.create(data);
    return this.punchItemRepository.save(item);
  }

  async findAll(projectId: string): Promise<PunchItem[]> {
    return this.punchItemRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PunchItem> {
    const item = await this.punchItemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Punch item ${id} not found`);
    return item;
  }

  async update(id: string, data: Partial<PunchItem>): Promise<PunchItem> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.punchItemRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.punchItemRepository.remove(item);
  }

  async getStats(projectId: string): Promise<any> {
    const items = await this.findAll(projectId);
    return {
      total: items.length,
      open: items.filter((i) => i.status === PunchItemStatus.OPEN).length,
      inProgress: items.filter((i) => i.status === PunchItemStatus.IN_PROGRESS)
        .length,
      verified: items.filter((i) => i.status === PunchItemStatus.VERIFIED)
        .length,
      closed: items.filter((i) => i.status === PunchItemStatus.CLOSED).length,
    };
  }
}
