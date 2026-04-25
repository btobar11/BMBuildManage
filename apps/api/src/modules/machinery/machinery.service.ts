import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machinery } from './machinery.entity';
import { CreateMachineryDto } from './dto/create-machinery.dto';

@Injectable()
export class MachineryService {
  constructor(
    @InjectRepository(Machinery)
    private readonly machineryRepository: Repository<Machinery>,
  ) {}

  private requireCompanyId(companyId?: string): string {
    if (!companyId) {
      throw new ForbiddenException('Missing company context');
    }
    return companyId;
  }

  create(companyId: string, createMachineryDto: CreateMachineryDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const machinery = this.machineryRepository.create({
      ...createMachineryDto,
      company_id: requiredCompanyId,
    });
    return this.machineryRepository.save(machinery);
  }

  findAllByCompany(companyId: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    return this.machineryRepository.find({
      where: { company_id: requiredCompanyId },
    });
  }

  async findOne(companyId: string, id: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    const machinery = await this.machineryRepository.findOne({
      where: { id, company_id: requiredCompanyId },
    });
    if (!machinery) {
      throw new NotFoundException(`Machinery with ID ${id} not found`);
    }
    return machinery;
  }

  async remove(companyId: string, id: string) {
    const machinery = await this.findOne(companyId, id);
    await this.machineryRepository.remove(machinery);
    return { deleted: true };
  }
}
