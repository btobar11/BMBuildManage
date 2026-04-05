import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Resource } from './resource.entity';
import { ResourcePriceHistory } from './resource-price-history.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(ResourcePriceHistory)
    private readonly historyRepo: Repository<ResourcePriceHistory>,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateResourceDto) {
    const resource = this.resourceRepo.create(dto);
    return this.resourceRepo.save(resource);
  }

  findAll(companyId?: string) {
    // Return resources that belong to the company OR global ones (company_id is null)
    const where = companyId 
      ? [{ company_id: companyId }, { company_id: IsNull() }] 
      : { company_id: IsNull() };
      
    return this.resourceRepo.find({ 
      where, 
      relations: ['unit'],
      order: { name: 'ASC' } 
    });
  }

  async findOne(id: string) {
    const resource = await this.resourceRepo.findOne({
      where: { id },
      relations: ['price_history', 'unit'],
    });
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    return resource;
  }

  async update(id: string, dto: UpdateResourceDto) {
    const resource = await this.findOne(id);

    // If price changed, record it in history
    if (dto.base_price !== undefined && Number(dto.base_price) !== Number(resource.base_price)) {
      const entry = this.historyRepo.create({
        resource_id: id,
        price: resource.base_price,
      });
      await this.historyRepo.save(entry);
    }

    this.resourceRepo.merge(resource, dto);
    return this.resourceRepo.save(resource);
  }

  async remove(id: string) {
    const resource = await this.findOne(id);

    const isUsed = await this.dataSource.query(
      `SELECT id FROM apu_resources WHERE resource_id = $1 LIMIT 1`,
      [id]
    );
    if (isUsed.length > 0) {
      throw new BadRequestException(`No se puede eliminar este Recurso porque está asignado a uno o más APUs.`);
    }

    await this.resourceRepo.remove(resource);
    return { deleted: true };
  }

  findHistory(resourceId: string) {
    return this.historyRepo.find({
      where: { resource_id: resourceId },
      order: { date: 'DESC' },
    });
  }

  // Bulk import
  async bulkCreate(items: CreateResourceDto[]) {
    const resources = this.resourceRepo.create(items);
    return this.resourceRepo.save(resources);
  }
}
