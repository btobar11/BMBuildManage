import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  private requireCompanyId(companyId?: string): string {
    if (!companyId) {
      throw new ForbiddenException('Missing company context');
    }
    return companyId;
  }

  create(companyId: string, dto: CreateResourceDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const resource = this.resourceRepo.create({
      ...dto,
      company_id: requiredCompanyId,
    });
    return this.resourceRepo.save(resource);
  }

  findAll(params: { companyId?: string; tab?: string }) {
    const { companyId, tab } = params;
    const requiredCompanyId = this.requireCompanyId(companyId);

    // tab = 'global' → solo recursos globales (company_id IS NULL)
    // tab = 'personal' → recursos de la empresa + globales
    // sin params → recursos de la empresa + globales
    let where: any;

    if (tab === 'global') {
      // Solo recursos globales
      where = { company_id: IsNull() };
    } else {
      // Recursos de la empresa + globales
      where = [{ company_id: requiredCompanyId }, { company_id: IsNull() }];
    }

    return this.resourceRepo.find({
      where,
      relations: ['unit'],
      order: { name: 'ASC' },
    });
  }

  async findOne(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const resource = await this.resourceRepo.findOne({
      where: [
        { id, company_id: requiredCompanyId },
        { id, company_id: IsNull() },
      ],
      relations: ['price_history', 'unit'],
    });
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    return resource;
  }

  async update(companyId: string, id: string, dto: UpdateResourceDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const resource = await this.findOne(requiredCompanyId, id);

    if (resource.company_id === null) {
      throw new ForbiddenException('Global resources cannot be modified');
    }
    if (resource.company_id !== requiredCompanyId) {
      throw new NotFoundException(`Resource ${id} not found`);
    }

    // If price changed, record it in history
    if (
      dto.base_price !== undefined &&
      Number(dto.base_price) !== Number(resource.base_price)
    ) {
      const entry = this.historyRepo.create({
        resource_id: id,
        price: resource.base_price,
      });
      await this.historyRepo.save(entry);
    }

    this.resourceRepo.merge(resource, dto);
    return this.resourceRepo.save(resource);
  }

  async remove(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const resource = await this.findOne(requiredCompanyId, id);

    if (resource.company_id === null) {
      throw new ForbiddenException('Global resources cannot be deleted');
    }
    if (resource.company_id !== requiredCompanyId) {
      throw new NotFoundException(`Resource ${id} not found`);
    }

    const isUsed = await this.dataSource.query(
      `SELECT id FROM apu_resources WHERE resource_id = $1 LIMIT 1`,
      [id],
    );
    if (isUsed.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar este Recurso porque está asignado a uno o más APUs.`,
      );
    }

    await this.resourceRepo.remove(resource);
    return { deleted: true };
  }

  async findHistory(companyId: string, resourceId: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const resource = await this.findOne(requiredCompanyId, resourceId);

    if (resource.company_id === null) {
      throw new ForbiddenException('Global resource history is not available');
    }
    if (resource.company_id !== requiredCompanyId) {
      throw new NotFoundException(`Resource ${resourceId} not found`);
    }

    return this.historyRepo.find({
      where: { resource_id: resourceId },
      order: { date: 'DESC' },
    });
  }

  // Bulk import
  async bulkCreate(companyId: string, items: CreateResourceDto[]) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const resources = this.resourceRepo.create(
      items.map((item) => ({ ...item, company_id: requiredCompanyId })),
    );
    return this.resourceRepo.save(resources);
  }
}
