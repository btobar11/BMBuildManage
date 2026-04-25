import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async create(data: Partial<Lead>): Promise<Lead> {
    const lead = this.leadRepo.create(data);
    return await this.leadRepo.save(lead);
  }

  async findAll(): Promise<Lead[]> {
    return await this.leadRepo.find({ order: { created_at: 'DESC' } });
  }

  async updateStatus(id: string, status: string): Promise<Lead> {
    const lead = await this.leadRepo.findOneOrFail({ where: { id } });
    lead.status = status;
    return await this.leadRepo.save(lead);
  }
}
