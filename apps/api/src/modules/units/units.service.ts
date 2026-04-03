import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit, UnitCategory } from './unit.entity';

@Injectable()
export class UnitsService implements OnModuleInit {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}

  async onModuleInit() {
    const count = await this.unitRepository.count();
    if (count === 0) {
      await this.seedDefaults();
    }
  }

  private async seedDefaults() {
    const defaultUnits = [
      { name: 'Metro Cuadrado', symbol: 'm2', category: UnitCategory.AREA },
      { name: 'Metro Cúbico', symbol: 'm3', category: UnitCategory.VOLUME },
      { name: 'Metro Lineal', symbol: 'ml', category: UnitCategory.LENGTH },
      { name: 'Unidad', symbol: 'un', category: UnitCategory.QUANTITY },
      { name: 'Global', symbol: 'gl', category: UnitCategory.QUANTITY },
      { name: 'Kilogramo', symbol: 'kg', category: UnitCategory.WEIGHT },
      { name: 'Hora', symbol: 'hr', category: UnitCategory.TIME },
      { name: 'Día', symbol: 'día', category: UnitCategory.TIME },
      { name: 'Mes', symbol: 'mes', category: UnitCategory.TIME },
      { name: 'Litro', symbol: 'L', category: UnitCategory.VOLUME },
    ];
    await this.unitRepository.save(this.unitRepository.create(defaultUnits));
  }

  findAll() {
    return this.unitRepository.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  findOne(id: string) {
    return this.unitRepository.findOne({ where: { id } });
  }

  create(data: Partial<Unit>) {
    const unit = this.unitRepository.create(data);
    return this.unitRepository.save(unit);
  }
}
