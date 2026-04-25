import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@Controller('templates')
@UseGuards(SupabaseAuthGuard)
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @Body() createDto: CreateTemplateDto,
  ) {
    return this.service.create(companyId, createDto);
  }

  @Get()
  findAll(@CurrentCompany() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.service.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
  ) {
    return this.service.update(id, companyId, updateDto);
  }

  @Delete(':id')
  remove(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.service.remove(id, companyId);
  }
}
