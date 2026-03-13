import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  create(createDto: CreateDocumentDto) {
    const document = this.documentRepository.create(createDto);
    return this.documentRepository.save(document);
  }

  findAllByProject(projectId: string) {
    return this.documentRepository.find({ where: { project_id: projectId } });
  }

  async findOne(id: string) {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async update(id: string, updateDto: UpdateDocumentDto) {
    const document = await this.findOne(id);
    this.documentRepository.merge(document, updateDto);
    return this.documentRepository.save(document);
  }

  async remove(id: string) {
    const document = await this.findOne(id);
    await this.documentRepository.remove(document);
    return { deleted: true };
  }
}
