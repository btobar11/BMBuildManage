import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectContingency } from './project-contingency.entity';
import { CreateContingencyDto } from './dto/create-contingency.dto';

@Injectable()
export class ContingenciesService {
  constructor(
    @InjectRepository(ProjectContingency)
    private readonly repo: Repository<ProjectContingency>,
  ) {}

  create(dto: CreateContingencyDto) {
    const c = this.repo.create(dto);
    return this.repo.save(c);
  }

  findByProject(projectId: string) {
    return this.repo.find({
      where: { project_id: projectId },
      order: { date: 'DESC' },
    });
  }

  async remove(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Contingency ${id} not found`);
    await this.repo.remove(c);
    return { deleted: true };
  }

  async totalByProject(projectId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('c')
      .select('SUM(c.total_cost)', 'total')
      .where('c.project_id = :projectId', { projectId })
      .getRawOne();
    return Number(result?.total ?? 0);
  }
}
