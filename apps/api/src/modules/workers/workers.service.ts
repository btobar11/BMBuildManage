import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from './worker.entity';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
  ) {}

  create(createWorkerDto: CreateWorkerDto) {
    const worker = this.workerRepository.create(createWorkerDto);
    return this.workerRepository.save(worker);
  }

  findAll(companyId: string) {
    return this.workerRepository.find({ where: { company_id: companyId } });
  }

  async findOne(id: string, companyId: string) {
    const worker = await this.workerRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['assignments', 'payments'],
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async update(id: string, companyId: string, updateWorkerDto: UpdateWorkerDto) {
    const worker = await this.findOne(id, companyId);
    this.workerRepository.merge(worker, updateWorkerDto);
    return this.workerRepository.save(worker);
  }

  async remove(id: string, companyId: string) {
    const worker = await this.findOne(id, companyId);
    await this.workerRepository.remove(worker);
    return { deleted: true };
  }
}
