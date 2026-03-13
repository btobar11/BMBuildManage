import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerPayment } from './worker-payment.entity';
import { CreateWorkerPaymentDto } from './dto/create-worker-payment.dto';
import { UpdateWorkerPaymentDto } from './dto/update-worker-payment.dto';

@Injectable()
export class WorkerPaymentsService {
  constructor(
    @InjectRepository(WorkerPayment)
    private readonly paymentRepository: Repository<WorkerPayment>,
  ) {}

  create(createDto: CreateWorkerPaymentDto) {
    const payment = this.paymentRepository.create(createDto);
    return this.paymentRepository.save(payment);
  }

  findAllByProject(projectId: string) {
    return this.paymentRepository.find({
      where: { project_id: projectId },
      relations: ['worker'],
    });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['worker', 'project'],
    });
    if (!payment) {
      throw new NotFoundException(`WorkerPayment with ID ${id} not found`);
    }
    return payment;
  }

  async update(id: string, updateDto: UpdateWorkerPaymentDto) {
    const payment = await this.findOne(id);
    this.paymentRepository.merge(payment, updateDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
    return { deleted: true };
  }
}
