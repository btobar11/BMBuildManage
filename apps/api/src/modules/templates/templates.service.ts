import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  create(createDto: CreateTemplateDto) {
    const template = this.templateRepository.create(createDto);
    return this.templateRepository.save(template);
  }

  findAll(companyId: string) {
    return this.templateRepository.find({
      where: { company_id: companyId },
      relations: ['stages', 'stages.items'],
    });
  }

  async findOne(id: string, companyId: string) {
    const template = await this.templateRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['stages', 'stages.items'],
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async update(id: string, companyId: string, updateDto: UpdateTemplateDto) {
    const template = await this.findOne(id, companyId);
    this.templateRepository.merge(template, updateDto);
    return this.templateRepository.save(template);
  }

  async remove(id: string, companyId: string) {
    const template = await this.findOne(id, companyId);
    await this.templateRepository.remove(template);
    return { deleted: true };
  }
}
