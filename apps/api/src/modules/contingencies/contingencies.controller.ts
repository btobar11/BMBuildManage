import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ContingenciesService } from './contingencies.service';
import { CreateContingencyDto } from './dto/create-contingency.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('contingencies')
@UseGuards(SupabaseAuthGuard)
export class ContingenciesController {
  constructor(private readonly contingenciesService: ContingenciesService) {}

  @Post()
  create(@Body() dto: CreateContingencyDto) {
    return this.contingenciesService.create(dto);
  }

  @Get('by-project/:projectId')
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.contingenciesService.findByProject(projectId);
  }

  @Get('summary/:projectId')
  async getSummary(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const total = await this.contingenciesService.totalByProject(projectId);
    return { total };
  }

  @Get('total/:projectId')
  totalByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.contingenciesService.totalByProject(projectId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contingenciesService.remove(id);
  }
}
