import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  async createLead(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.leadsService.createLead(dto, req.user.company_id);
  }
}
