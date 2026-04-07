import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subcontractor,
  SubcontractorContract,
  SubcontractorPayment,
  SubcontractorRAM,
} from './subcontractor.entity';

@Injectable()
export class SubcontractorsService {
  constructor(
    @InjectRepository(Subcontractor)
    private readonly subcontractorRepo: Repository<Subcontractor>,
    @InjectRepository(SubcontractorContract)
    private readonly contractRepo: Repository<SubcontractorContract>,
    @InjectRepository(SubcontractorPayment)
    private readonly paymentRepo: Repository<SubcontractorPayment>,
    @InjectRepository(SubcontractorRAM)
    private readonly ramRepo: Repository<SubcontractorRAM>,
  ) {}

  async getAll(companyId: string) {
    return this.subcontractorRepo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }

  async create(companyId: string, data: Partial<Subcontractor>) {
    const sub = this.subcontractorRepo.create({
      ...data,
      company_id: companyId,
    });
    return this.subcontractorRepo.save(sub);
  }

  async update(id: string, data: Partial<Subcontractor>) {
    const sub = await this.subcontractorRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subcontratista no encontrado');
    Object.assign(sub, data);
    return this.subcontractorRepo.save(sub);
  }

  async getContracts(projectId: string) {
    return this.contractRepo.find({
      where: { project_id: projectId },
      relations: ['subcontractor'],
      order: { created_at: 'DESC' },
    });
  }

  async createContract(
    projectId: string,
    data: Partial<SubcontractorContract>,
  ) {
    const contract = this.contractRepo.create({
      ...data,
      project_id: projectId,
    });
    return this.contractRepo.save(contract);
  }

  async updateContract(id: string, data: Partial<SubcontractorContract>) {
    const contract = await this.contractRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    Object.assign(contract, data);
    return this.contractRepo.save(contract);
  }

  async getPayments(contractId: string) {
    return this.paymentRepo.find({
      where: { contract_id: contractId },
      order: { payment_date: 'DESC' },
    });
  }

  async createPayment(contractId: string, data: Partial<SubcontractorPayment>) {
    const payment = this.paymentRepo.create({
      ...data,
      contract_id: contractId,
    });
    const saved = await this.paymentRepo.save(payment);

    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
    });
    if (contract) {
      contract.paid_amount = (contract.paid_amount || 0) + saved.amount;
      await this.contractRepo.save(contract);
    }

    return saved;
  }

  async getRAM(contractId: string) {
    return this.ramRepo.find({
      where: { contract_id: contractId },
      order: { created_at: 'DESC' },
    });
  }

  async createRAMItem(contractId: string, data: Partial<SubcontractorRAM>) {
    const ram = this.ramRepo.create({ ...data, contract_id: contractId });
    return this.ramRepo.save(ram);
  }

  async getProjectSummary(projectId: string) {
    const contracts = await this.contractRepo.find({
      where: { project_id: projectId },
      relations: ['subcontractor', 'payments'],
    });

    const summary = {
      totalContracts: contracts.length,
      totalValue: contracts.reduce(
        (sum, c) => sum + Number(c.contract_amount),
        0,
      ),
      totalPaid: contracts.reduce((sum, c) => sum + Number(c.paid_amount), 0),
      totalApproved: contracts.reduce(
        (sum, c) => sum + Number(c.approved_amount),
        0,
      ),
      pendingPayments: contracts.filter((c) => !c.is_completed).length,
      completedContracts: contracts.filter((c) => c.is_completed).length,
    };

    summary.totalApproved = summary.totalValue - summary.totalPaid;

    return { contracts, summary };
  }
}
