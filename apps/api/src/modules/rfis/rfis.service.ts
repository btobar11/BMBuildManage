import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rfi, RfiStatus } from './rfi.entity';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';

@Injectable()
export class RfisService {
  constructor(
    @InjectRepository(Rfi)
    private rfiRepository: Repository<Rfi>,
  ) {}

  async create(createRfiDto: CreateRfiDto): Promise<Rfi> {
    const rfi = this.rfiRepository.create(createRfiDto);
    return this.rfiRepository.save(rfi);
  }

  async findAll(projectId: string): Promise<Rfi[]> {
    return this.rfiRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Rfi> {
    const rfi = await this.rfiRepository.findOne({ where: { id } });
    if (!rfi) {
      throw new NotFoundException(`RFI with ID ${id} not found`);
    }
    return rfi;
  }

  async update(id: string, updateRfiDto: UpdateRfiDto): Promise<Rfi> {
    const rfi = await this.findOne(id);
    Object.assign(rfi, updateRfiDto);
    return this.rfiRepository.save(rfi);
  }

  async remove(id: string): Promise<void> {
    const rfi = await this.findOne(id);
    await this.rfiRepository.remove(rfi);
  }

  async getStats(projectId: string): Promise<any> {
    const rfis = await this.rfiRepository.find({
      where: { project_id: projectId },
    });
    return {
      total: rfis.length,
      open: rfis.filter((r) => r.status !== RfiStatus.CLOSED).length,
      closed: rfis.filter((r) => r.status === RfiStatus.CLOSED).length,
      overdue: rfis.filter(
        (r) =>
          r.due_date &&
          new Date(r.due_date) < new Date() &&
          r.status !== RfiStatus.CLOSED,
      ).length,
    };
  }
}
