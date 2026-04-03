import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(createMachineryDto: CreateMachineryDto) {
    const machinery = this.machineryRepository.create(createMachineryDto);
    return this.machineryRepository.save(machinery);
  }

  findAllByCompany(companyId: string) {
    return this.machineryRepository.find({
      where: { company_id: companyId },
    });
  }

  async findOne(id: string) {
    const machinery = await this.machineryRepository.findOne({
      where: { id },
    });
    if (!machinery) {
      throw new NotFoundException(`Machinery with ID ${id} not found`);
    }
    return machinery;
  }

  async remove(id: string) {
    const machinery = await this.findOne(id);
    await this.machineryRepository.remove(machinery);
    return { deleted: true };
  }
}
