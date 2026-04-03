import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(createMaterialDto: CreateMaterialDto) {
    const material = this.materialRepository.create(createMaterialDto);
    return this.materialRepository.save(material);
  }

  findAll(search?: string) {
    if (search) {
      return this.materialRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { category: Like(`%${search}%`) },
        ],
      });
    }
    return this.materialRepository.find();
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    return material;
  }

  async remove(id: string) {
    const material = await this.findOne(id);
    await this.materialRepository.remove(material);
    return { deleted: true };
  }
}
