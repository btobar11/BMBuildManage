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

  create(createDto: CreateDocumentDto, companyId: string) {
    const document = this.documentRepository.create({
      ...createDto,
      company_id: companyId,
    });
    return this.documentRepository.save(document);
  }

  findAllByProject(projectId: string, companyId: string) {
    return this.documentRepository.find({
      where: {
        project_id: projectId,
        company_id: companyId,
      },
      order: { uploaded_at: 'DESC' },
      relations: ['project'],
    });
  }

  async findOne(id: string, companyId: string) {
    const document = await this.documentRepository.findOne({
      where: {
        id,
        company_id: companyId,
      },
      relations: ['project'],
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async update(id: string, updateDto: UpdateDocumentDto, companyId: string) {
    const document = await this.findOne(id, companyId);
    this.documentRepository.merge(document, updateDto);
    return this.documentRepository.save(document);
  }

  async remove(id: string, companyId: string) {
    const document = await this.findOne(id, companyId);
    await this.documentRepository.remove(document);
    return { deleted: true };
  }
}
