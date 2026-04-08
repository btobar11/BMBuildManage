import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  create(createInvoiceDto: CreateInvoiceDto, companyId: string) {
    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      company_id: companyId,
    });
    return this.invoiceRepository.save(invoice);
  }

  findAllByProject(projectId?: string, companyId?: string) {
    const where: any = {};
    if (projectId) where.project_id = projectId;
    if (companyId) where.company_id = companyId;

    return this.invoiceRepository.find({
      where,
      order: { created_at: 'DESC' },
      relations: ['project'],
    });
  }

  async findOne(id: string, companyId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { 
        id,
        company_id: companyId,
      },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async remove(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    await this.invoiceRepository.remove(invoice);
    return { deleted: true };
  }
}
