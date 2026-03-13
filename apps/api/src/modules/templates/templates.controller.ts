import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('templates')
@UseGuards(SupabaseAuthGuard)
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Post()
  create(@Body() createDto: CreateTemplateDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('company_id') companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('company_id') companyId: string) {
    return this.service.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('company_id') companyId: string,
    @Body() updateDto: UpdateTemplateDto,
  ) {
    return this.service.update(id, companyId, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('company_id') companyId: string) {
    return this.service.remove(id, companyId);
  }
}
