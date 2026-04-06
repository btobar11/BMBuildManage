import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerAssignment } from './worker-assignment.entity';
import { CreateWorkerAssignmentDto } from './dto/create-worker-assignment.dto';
import { UpdateWorkerAssignmentDto } from './dto/update-worker-assignment.dto';

@Injectable()
export class WorkerAssignmentsService {
  constructor(
    @InjectRepository(WorkerAssignment)
    private readonly assignmentRepository: Repository<WorkerAssignment>,
  ) {}

  private async checkOverlap(
    workerId: string,
    startDate?: string | Date,
    endDate?: string | Date,
    excludeId?: string,
  ) {
    if (!startDate) return;

    if (endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la fecha de término.',
      );
    }

    const qb = this.assignmentRepository
      .createQueryBuilder('wa')
      .where('wa.worker_id = :workerId', { workerId });

    if (excludeId) {
      qb.andWhere('wa.id != :excludeId', { excludeId });
    }

    if (endDate) {
      qb.andWhere('(wa.end_date IS NULL OR wa.end_date >= :startDate)', {
        startDate,
      }).andWhere('(wa.start_date IS NULL OR wa.start_date <= :endDate)', {
        endDate,
      });
    } else {
      qb.andWhere('(wa.end_date IS NULL OR wa.end_date >= :startDate)', {
        startDate,
      });
    }

    const overlap = await qb.getOne();
    if (overlap) {
      throw new BadRequestException(
        'El trabajador ya tiene una asignación activa en esas fechas o hay un solapamiento.',
      );
    }
  }

  async create(createDto: CreateWorkerAssignmentDto) {
    await this.checkOverlap(
      createDto.worker_id,
      createDto.start_date,
      createDto.end_date,
    );
    const assignment = this.assignmentRepository.create(createDto);
    return this.assignmentRepository.save(assignment);
  }

  findAllByProject(projectId: string) {
    return this.assignmentRepository.find({
      where: { project_id: projectId },
      relations: ['worker'],
    });
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['worker', 'project'],
    });
    if (!assignment) {
      throw new NotFoundException(`WorkerAssignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(id: string, updateDto: UpdateWorkerAssignmentDto) {
    const assignment = await this.findOne(id);
    const startDate =
      updateDto.start_date !== undefined
        ? updateDto.start_date
        : assignment.start_date;
    const endDate =
      updateDto.end_date !== undefined
        ? updateDto.end_date
        : assignment.end_date;

    await this.checkOverlap(assignment.worker_id, startDate, endDate, id);

    this.assignmentRepository.merge(assignment, updateDto);
    return this.assignmentRepository.save(assignment);
  }

  async remove(id: string) {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
    return { deleted: true };
  }

  async getSummaryByProject(projectId: string) {
    const result = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .select('SUM(assignment.total_paid)', 'total')
      .where('assignment.project_id = :projectId', { projectId })
      .getRawOne();
    return { total: Number(result?.total || 0) };
  }
}
