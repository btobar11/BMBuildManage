import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { ApuTemplate } from './apu-template.entity';
import { ApuResource } from './apu-resource.entity';
import { CreateApuTemplateDto } from './dto/create-apu-template.dto';
import { UpdateApuTemplateDto } from './dto/update-apu-template.dto';

@Injectable()
export class ApuService {
  constructor(
    @InjectRepository(ApuTemplate)
    private readonly apuRepo: Repository<ApuTemplate>,
    @InjectRepository(ApuResource)
    private readonly apuResourceRepo: Repository<ApuResource>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Calculate unit cost from APU resources
   * unit_cost = Σ (resource.base_price × coefficient)
   */
  private calculateUnitCost(template: ApuTemplate): number {
    if (!template.apu_resources) return 0;
    return template.apu_resources.reduce((sum, ar) => {
      const price = Number(ar.resource?.base_price ?? 0);
      const coeff = Number(ar.coefficient ?? 0);
      return sum + price * coeff;
    }, 0);
  }

  async create(dto: CreateApuTemplateDto) {
    const { apu_resources, ...templateData } = dto;

    const template = this.apuRepo.create(templateData);
    if (apu_resources) {
      template.apu_resources = apu_resources.map((r) =>
        this.apuResourceRepo.create({ ...r, apu_id: undefined }),
      );
    }

    const saved = await this.apuRepo.save(template);
    return this.findOne(saved.id);
  }

  async findAll(companyId?: string, search?: string) {
    const qb = this.apuRepo
      .createQueryBuilder('apu')
      .leftJoinAndSelect('apu.apu_resources', 'ar')
      .leftJoinAndSelect('ar.resource', 'r')
      .leftJoinAndSelect('apu.unit', 'u')
      .orderBy('apu.name', 'ASC');

    if (companyId) qb.andWhere('apu.company_id = :companyId', { companyId });
    if (search) qb.andWhere('apu.name ILIKE :search', { search: `%${search}%` });

    const templates = await qb.getMany();
    return templates.map((t) => ({ ...t, unit_cost: this.calculateUnitCost(t) }));
  }

  async findOne(id: string) {
    const template = await this.apuRepo.findOne({
      where: { id },
      relations: ['apu_resources', 'apu_resources.resource', 'unit'],
    });
    if (!template) throw new NotFoundException(`APU Template ${id} not found`);
    return { ...template, unit_cost: this.calculateUnitCost(template) };
  }

  async update(id: string, dto: UpdateApuTemplateDto) {
    const template = await this.apuRepo.findOne({ where: { id }, relations: ['apu_resources'] });
    if (!template) throw new NotFoundException(`APU Template ${id} not found`);

    const { apu_resources, ...templateData } = dto;

    if (apu_resources !== undefined) {
      // Replace all APU resources
      await this.apuResourceRepo.delete({ apu_id: id });
      template.apu_resources = apu_resources.map((r) =>
        this.apuResourceRepo.create({ ...r, apu_id: id }),
      );
    }

    this.apuRepo.merge(template, templateData);
    await this.apuRepo.save(template);
    return this.findOne(id);
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    const dto: CreateApuTemplateDto = {
      company_id: original.company_id,
      name: `${original.name} (copia)`,
      unit_id: original.unit_id,
      description: original.description,
      apu_resources: original.apu_resources?.map((r) => ({
        resource_id: r.resource_id,
        resource_type: r.resource_type,
        coefficient: Number(r.coefficient),
      })),
    };
    return this.create(dto);
  }

  async remove(id: string) {
    const template = await this.apuRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`APU Template ${id} not found`);

    const isUsed = await this.dataSource.query(
      `SELECT id FROM items WHERE apu_template_id = $1 LIMIT 1`,
      [id]
    );
    if (isUsed.length > 0) {
      throw new BadRequestException(`No se puede eliminar la APU base porque está en uso en uno o más ítems de presupuesto.`);
    }

    await this.apuRepo.remove(template);
    return { deleted: true };
  }
}
