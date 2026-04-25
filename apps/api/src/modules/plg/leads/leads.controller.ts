import { Controller, Post, Get, Body, Param, Patch } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async create(@Body() data: Partial<Lead>) {
    return this.leadsService.create(data);
  }

  @Get()
  async findAll() {
    return this.leadsService.findAll();
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.leadsService.updateStatus(id, status);
  }
}
