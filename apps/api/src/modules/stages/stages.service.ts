import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stage } from './stage.entity';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';

@Injectable()
export class StagesService {
  constructor(
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
  ) {}

  create(createStageDto: CreateStageDto) {
    const stage = this.stageRepository.create(createStageDto);
    return this.stageRepository.save(stage);
  }

  findAllByBudget(budgetId: string) {
    return this.stageRepository.find({
      where: { budget_id: budgetId },
      relations: ['items'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string) {
    const stage = await this.stageRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${id} not found`);
    }
    return stage;
  }

  async update(id: string, updateStageDto: UpdateStageDto) {
    const stage = await this.findOne(id);
    this.stageRepository.merge(stage, updateStageDto);
    return this.stageRepository.save(stage);
  }

  async remove(id: string) {
    const stage = await this.findOne(id);
    await this.stageRepository.remove(stage);
    return { deleted: true };
  }
}
