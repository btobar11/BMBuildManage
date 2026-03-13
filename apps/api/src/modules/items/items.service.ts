import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  create(createItemDto: CreateItemDto) {
    const item = this.itemRepository.create(createItemDto);
    return this.itemRepository.save(item);
  }

  findAllByStage(stageId: string) {
    return this.itemRepository.find({ where: { stage_id: stageId } });
  }

  async findOne(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto) {
    const item = await this.findOne(id);
    this.itemRepository.merge(item, updateItemDto);
    return this.itemRepository.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
    return { deleted: true };
  }
}
