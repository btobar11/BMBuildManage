import { Controller, Post, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async createLead(@Body() body: { email: string; companyName: string }) {
    if (!body.email || !body.companyName) {
      throw new Error('Email and companyName are required');
    }
    return this.leadsService.createLead(body.email, body.companyName);
  }
}
