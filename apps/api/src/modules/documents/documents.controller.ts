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
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('documents')
@UseGuards(SupabaseAuthGuard)
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post()
  create(@Body() createDto: CreateDocumentDto, @Request() req: any) {
    const { company_id } = req.user;
    return this.service.create(createDto, company_id);
  }

  @Get()
  findAll(@Query('project_id') projectId: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.service.findAllByProject(projectId, company_id);
  }

  @Get('project/:id')
  findByProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Request() req: any,
  ) {
    const { company_id } = req.user;
    return this.service.findAllByProject(projectId, company_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.service.findOne(id, company_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentDto,
    @Request() req: any,
  ) {
    const { company_id } = req.user;
    return this.service.update(id, updateDto, company_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.service.remove(id, company_id);
  }
}
