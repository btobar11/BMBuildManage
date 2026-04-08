import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('invoices')
@UseGuards(SupabaseAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: any) {
    const { company_id } = req.user;
    return this.invoicesService.create(createInvoiceDto, company_id);
  }

  @Get()
  findAll(@Query('project_id') projectId: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.invoicesService.findAllByProject(projectId, company_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.invoicesService.findOne(id, company_id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.invoicesService.remove(id, company_id);
  }
}
