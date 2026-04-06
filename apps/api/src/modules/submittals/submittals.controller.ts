import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubmittalsService } from './submittals.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('submittals')
@UseGuards(SupabaseAuthGuard)
export class SubmittalsController {
  constructor(private readonly submittalsService: SubmittalsService) {}

  @Post()
  create(@Body() data: any) {
    return this.submittalsService.create(data);
  }

  @Get()
  findAll(@Query('project_id') projectId: string) {
    return this.submittalsService.findAll(projectId);
  }

  @Get('stats')
  getStats(@Query('project_id') projectId: string) {
    return this.submittalsService.getStats(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submittalsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.submittalsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.submittalsService.remove(id);
  }
}
