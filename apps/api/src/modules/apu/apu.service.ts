import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, In } from 'typeorm';
import { ApuTemplate } from './apu-template.entity';
import { ApuResource } from './apu-resource.entity';
import { CreateApuTemplateDto } from './dto/create-apu-template.dto';
import { UpdateApuTemplateDto } from './dto/update-apu-template.dto';
import { Resource } from '../resources/resource.entity';

@Injectable()
export class ApuService {
  constructor(
    @InjectRepository(ApuTemplate)
    private readonly apuRepo: Repository<ApuTemplate>,
    @InjectRepository(ApuResource)
    private readonly apuResourceRepo: Repository<ApuResource>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    private readonly dataSource: DataSource,
  ) {}

  private requireCompanyId(companyId?: string): string {
    if (!companyId) {
      throw new ForbiddenException('Missing company context');
    }
    return companyId;
  }

  private async assertResourcesAccessible(
    companyId: string,
    apuResources?: { resource_id: string }[],
  ): Promise<void> {
    if (!apuResources || apuResources.length === 0) return;

    const resourceIds = Array.from(
      new Set(apuResources.map((r) => r.resource_id).filter(Boolean)),
    );
    if (resourceIds.length === 0) return;

    const found = await this.resourceRepo.find({
      select: ['id'],
      where: [
        { id: In(resourceIds), company_id: companyId },
        { id: In(resourceIds), company_id: IsNull() },
      ],
    });

    if (found.length !== resourceIds.length) {
      throw new BadRequestException(
        'One or more resources are not accessible for this company',
      );
    }
  }

  private calculateUnitCost(template: ApuTemplate): number {
    if (!template.apu_resources) return 0;
    return template.apu_resources.reduce((sum, ar) => {
      const price = Number(ar.resource?.base_price ?? 0);
      const coeff = Number(ar.coefficient ?? 0);
      return sum + price * coeff;
    }, 0);
  }

  async create(companyId: string, dto: CreateApuTemplateDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const { apu_resources, ...templateData } = dto;

    await this.assertResourcesAccessible(requiredCompanyId, apu_resources);

    const template = this.apuRepo.create({
      ...templateData,
      company_id: requiredCompanyId,
    });
    if (apu_resources) {
      template.apu_resources = apu_resources.map((r) =>
        this.apuResourceRepo.create({ ...r, apu_id: undefined }),
      );
    }

    const saved = await this.apuRepo.save(template);
    return this.findOne(requiredCompanyId, saved.id);
  }

  async findAll(
    companyId?: string,
    search?: string,
    tab?: 'personal' | 'global',
  ) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const qb = this.apuRepo
      .createQueryBuilder('apu')
      .leftJoinAndSelect('apu.apu_resources', 'ar')
      .leftJoinAndSelect('ar.resource', 'r')
      .leftJoinAndSelect('apu.unit', 'u')
      .orderBy('apu.name', 'ASC');

    if (tab === 'global') {
      qb.andWhere('apu.company_id IS NULL');
    } else if (tab === 'personal' && requiredCompanyId) {
      qb.andWhere('(apu.company_id = :companyId OR apu.company_id IS NULL)', {
        companyId: requiredCompanyId,
      });
    } else if (requiredCompanyId) {
      qb.andWhere('(apu.company_id = :companyId OR apu.company_id IS NULL)', {
        companyId: requiredCompanyId,
      });
    } else {
      qb.andWhere('apu.company_id IS NULL');
    }

    if (search) {
      qb.andWhere('apu.name ILIKE :search', { search: `%${search}%` });
    }

    const templates = await qb.getMany();
    return templates.map((t) => ({
      ...t,
      unit_cost: this.calculateUnitCost(t),
    }));
  }

  async findOne(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const template = await this.apuRepo.findOne({
      where: [
        { id, company_id: requiredCompanyId },
        { id, company_id: IsNull() },
      ],
      relations: ['apu_resources', 'apu_resources.resource', 'unit'],
    });
    if (!template) throw new NotFoundException(`APU Template ${id} not found`);
    return { ...template, unit_cost: this.calculateUnitCost(template) };
  }

  async update(companyId: string, id: string, dto: UpdateApuTemplateDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const template = await this.apuRepo.findOne({
      where: { id, company_id: requiredCompanyId },
      relations: ['apu_resources'],
    });
    if (!template) throw new NotFoundException(`APU Template ${id} not found`);

    const { apu_resources, ...templateData } = dto;

    if (apu_resources !== undefined) {
      await this.assertResourcesAccessible(requiredCompanyId, apu_resources);
      await this.apuResourceRepo.delete({ apu_id: id });
      template.apu_resources = apu_resources.map((r) =>
        this.apuResourceRepo.create({ ...r, apu_id: id }),
      );
    }

    this.apuRepo.merge(template, templateData);
    await this.apuRepo.save(template);
    return this.findOne(requiredCompanyId, id);
  }

  async duplicate(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const original = await this.findOne(requiredCompanyId, id);
    const dto: CreateApuTemplateDto = {
      name: `${original.name} (copia)`,
      unit_id: original.unit_id,
      description: original.description,
      apu_resources: original.apu_resources?.map((r) => ({
        resource_id: r.resource_id,
        resource_type: r.resource_type,
        coefficient: Number(r.coefficient),
      })),
    };
    return this.create(requiredCompanyId, dto);
  }

  async importGlobalLibrary(companyId: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const globalTemplates = await this.apuRepo.find({
      where: { company_id: IsNull() },
      relations: ['apu_resources'],
    });

    if (globalTemplates.length === 0) {
      return {
        imported: 0,
        message: 'No hay plantillas globales para importar',
      };
    }

    let imported = 0;
    for (const globalTemplate of globalTemplates) {
      const exists = await this.apuRepo.findOne({
        where: {
          company_id: requiredCompanyId,
          name: globalTemplate.name,
        },
      });

      if (!exists) {
        const newTemplate = this.apuRepo.create({
          name: globalTemplate.name,
          unit_id: globalTemplate.unit_id,
          description: globalTemplate.description,
          category: globalTemplate.category,
          company_id: requiredCompanyId,
        });
        const saved = await this.apuRepo.save(newTemplate);

        for (const resource of globalTemplate.apu_resources) {
          const newResource = this.apuResourceRepo.create({
            apu_id: saved.id,
            resource_id: resource.resource_id,
            resource_type: resource.resource_type,
            coefficient: resource.coefficient,
          });
          await this.apuResourceRepo.save(newResource);
        }
        imported++;
      }
    }

    return {
      imported,
      total: globalTemplates.length,
      message: `Se importaron ${imported} partidas de la biblioteca global`,
    };
  }

  async remove(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const template = await this.apuRepo.findOne({
      where: { id, company_id: requiredCompanyId },
    });
    if (!template) throw new NotFoundException(`APU Template ${id} not found`);

    const isUsed = await this.dataSource.query(
      `SELECT id FROM items WHERE apu_template_id = $1 LIMIT 1`,
      [id],
    );
    if (isUsed.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la APU base porque está en uso en uno o más ítems de presupuesto.`,
      );
    }

    await this.apuRepo.remove(template);
    return { deleted: true };
  }
}
