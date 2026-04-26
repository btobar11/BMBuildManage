import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async createLead(dto: CreateLeadDto, company_id: string): Promise<Lead> {
    const lead = this.leadRepo.create({
      email: dto.email,
      company_name: dto.companyName,
      company_id,
    });
    await this.leadRepo.save(lead);
    this.logger.log(`New lead created: ${dto.email} for company ${company_id}`);
    return lead;
  }
}
