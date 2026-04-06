import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submittal } from './submittal.entity';

@Injectable()
export class SubmittalsService {
  constructor(
    @InjectRepository(Submittal)
    private submittalRepository: Repository<Submittal>,
  ) {}

  async create(data: Partial<Submittal>): Promise<Submittal> {
    const submittal = this.submittalRepository.create(data);
    return this.submittalRepository.save(submittal);
  }

  async findAll(projectId: string): Promise<Submittal[]> {
    return this.submittalRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Submittal> {
    const submittal = await this.submittalRepository.findOne({ where: { id } });
    if (!submittal) throw new NotFoundException(`Submittal ${id} not found`);
    return submittal;
  }

  async update(id: string, data: Partial<Submittal>): Promise<Submittal> {
    const submittal = await this.findOne(id);
    Object.assign(submittal, data);
    return this.submittalRepository.save(submittal);
  }

  async remove(id: string): Promise<void> {
    const submittal = await this.findOne(id);
    await this.submittalRepository.remove(submittal);
  }

  async getStats(projectId: string): Promise<any> {
    const submittals = await this.findAll(projectId);
    return {
      total: submittals.length,
      pending: submittals.filter((s) =>
        ['draft', 'submitted', 'under_review'].includes(s.status),
      ).length,
      approved: submittals.filter((s) => s.status === 'approved').length,
      rejected: submittals.filter((s) => s.status === 'rejected').length,
    };
  }
}
