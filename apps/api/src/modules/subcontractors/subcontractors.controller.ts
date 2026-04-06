import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubcontractorsService } from './subcontractors.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('subcontractors')
@UseGuards(SupabaseAuthGuard)
export class SubcontractorsController {
  constructor(private readonly service: SubcontractorsService) {}

  @Get()
  async getAll(@CurrentUser() user: any) {
    return this.service.getAll(user.company_id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.company_id, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Get('project/:projectId/contracts')
  async getContracts(@Param('projectId') projectId: string) {
    return this.service.getContracts(projectId);
  }

  @Post('project/:projectId/contracts')
  async createContract(@Param('projectId') projectId: string, @Body() dto: any) {
    return this.service.createContract(projectId, dto);
  }

  @Get('contracts/:contractId/payments')
  async getPayments(@Param('contractId') contractId: string) {
    return this.service.getPayments(contractId);
  }

  @Post('contracts/:contractId/payments')
  async createPayment(@Param('contractId') contractId: string, @Body() dto: any) {
    return this.service.createPayment(contractId, dto);
  }

  @Get('project/:projectId/summary')
  async getProjectSummary(@Param('projectId') projectId: string) {
    return this.service.getProjectSummary(projectId);
  }
}