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
import { PunchListService } from './punch-list.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('punch-items')
@UseGuards(SupabaseAuthGuard)
export class PunchListController {
  constructor(private readonly punchListService: PunchListService) {}

  @Post()
  create(@Body() data: any) {
    return this.punchListService.create(data);
  }

  @Get()
  findAll(@Query('project_id') projectId: string) {
    return this.punchListService.findAll(projectId);
  }

  @Get('stats')
  getStats(@Query('project_id') projectId: string) {
    return this.punchListService.getStats(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.punchListService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.punchListService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.punchListService.remove(id);
  }
}
