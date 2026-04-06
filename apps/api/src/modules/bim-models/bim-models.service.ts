import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectModel } from './project-model.entity';

@Injectable()
export class BimModelsService {
  constructor(
    @InjectRepository(ProjectModel)
    private readonly modelRepository: Repository<ProjectModel>,
  ) {}

  async getModelsByProject(projectId: string) {
    return this.modelRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });
  }

  async createModel(projectId: string, data: Partial<ProjectModel>) {
    const model = this.modelRepository.create({
      project_id: projectId,
      ...data,
    });
    return this.modelRepository.save(model);
  }

  async deleteModel(modelId: string) {
    const model = await this.modelRepository.findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Modelo no encontrado');
    await this.modelRepository.remove(model);
    return { success: true };
  }
}