import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
  ) {}

  create(createBudgetDto: CreateBudgetDto) {
    const budget = this.budgetRepository.create(createBudgetDto);
    return this.budgetRepository.save(budget);
  }

  findAllByProject(projectId: string) {
    return this.budgetRepository.find({
      where: { project_id: projectId },
      relations: ['stages', 'stages.items'],
    });
  }

  async findOne(id: string) {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['stages', 'stages.items', 'project'],
    });
    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }
    return budget;
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.findOne(id);
    this.budgetRepository.merge(budget, updateBudgetDto);
    return this.budgetRepository.save(budget);
  }

  async remove(id: string) {
    const budget = await this.findOne(id);
    await this.budgetRepository.remove(budget);
    return { deleted: true };
  }
}
