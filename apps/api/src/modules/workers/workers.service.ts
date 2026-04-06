import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  findAll(companyId: string, projectId?: string) {
    const qb = this.workerRepository
      .createQueryBuilder('worker')
      .loadRelationCountAndMap('worker.assignmentsCount', 'worker.assignments')
      .where('worker.company_id = :companyId', { companyId });

    if (projectId) {
      qb.innerJoin(
        'worker.assignments',
        'assignment',
        'assignment.project_id = :projectId',
        { projectId },
      );
    }

    return qb.orderBy('worker.created_at', 'DESC').getMany();
  }

  async findOne(id: string, companyId: string) {
    const worker = await this.workerRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['assignments', 'assignments.project', 'payments'],
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async update(
    id: string,
    companyId: string,
    updateWorkerDto: UpdateWorkerDto,
  ) {
    const worker = await this.findOne(id, companyId);
    this.workerRepository.merge(worker, updateWorkerDto);
    return this.workerRepository.save(worker);
  }

  async remove(id: string, companyId: string) {
    const worker = await this.findOne(id, companyId);

    if (worker.assignments && worker.assignments.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar al trabajador "${worker.name}" porque tiene asignaciones de proyecto registradas.`,
      );
    }

    await this.workerRepository.remove(worker);
    return { deleted: true };
  }
}
