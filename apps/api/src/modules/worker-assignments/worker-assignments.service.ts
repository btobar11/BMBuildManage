import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(createDto: CreateWorkerAssignmentDto) {
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
    this.assignmentRepository.merge(assignment, updateDto);
    return this.assignmentRepository.save(assignment);
  }

  async remove(id: string) {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
    return { deleted: true };
  }
}
