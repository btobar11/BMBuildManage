import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  create(createClientDto: CreateClientDto) {
    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  findAll(companyId: string) {
    return this.clientRepository.find({ where: { company_id: companyId } });
  }

  async findOne(id: string, companyId: string) {
    const client = await this.clientRepository.findOne({
      where: { id, company_id: companyId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async update(id: string, companyId: string, updateClientDto: UpdateClientDto) {
    const client = await this.findOne(id, companyId);
    this.clientRepository.merge(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(id: string, companyId: string) {
    const client = await this.findOne(id, companyId);
    await this.clientRepository.remove(client);
    return { deleted: true };
  }
}
