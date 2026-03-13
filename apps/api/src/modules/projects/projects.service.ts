import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return await this.projectRepository.save(project);
  }

  async findAll(companyId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['budgets', 'expenses', 'documents'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(
    id: string,
    companyId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id, companyId);
    this.projectRepository.merge(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string, companyId: string): Promise<{ deleted: boolean }> {
    const project = await this.findOne(id, companyId);
    await this.projectRepository.remove(project);
    return { deleted: true };
  }
}
