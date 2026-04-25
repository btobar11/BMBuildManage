import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Material } from './material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  private requireCompanyId(companyId?: string): string {
    if (!companyId) {
      throw new ForbiddenException('Missing company context');
    }
    return companyId;
  }

  create(companyId: string, createMaterialDto: CreateMaterialDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const material = this.materialRepository.create({
      ...createMaterialDto,
      company_id: requiredCompanyId,
    });
    return this.materialRepository.save(material);
  }

  findAll(companyId: string, search?: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    if (search) {
      return this.materialRepository.find({
        where: [
          { company_id: requiredCompanyId, name: Like(`%${search}%`) },
          { company_id: requiredCompanyId, category: Like(`%${search}%`) },
        ],
      });
    }
    return this.materialRepository.find({
      where: { company_id: requiredCompanyId },
    });
  }

  async findOne(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const material = await this.materialRepository.findOne({
      where: { id, company_id: requiredCompanyId },
    });
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    return material;
  }

  async remove(companyId: string, id: string) {
    const material = await this.findOne(companyId, id);
    await this.materialRepository.remove(material);
    return { deleted: true };
  }
}
