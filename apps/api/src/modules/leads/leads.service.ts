import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './lead.entity';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async createLead(email: string, companyName: string): Promise<Lead> {
    const lead = this.leadRepo.create({ email, company_name: companyName });
    await this.leadRepo.save(lead);
    this.logger.log(`New lead created: ${email}`);
    return lead;
  }
}
