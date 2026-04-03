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
import { WorkerAssignmentsService } from './worker-assignments.service';
import { CreateWorkerAssignmentDto } from './dto/create-worker-assignment.dto';
import { UpdateWorkerAssignmentDto } from './dto/update-worker-assignment.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('worker-assignments')
@UseGuards(SupabaseAuthGuard)
export class WorkerAssignmentsController {
  constructor(private readonly service: WorkerAssignmentsService) {}

  @Post()
  create(@Body() createDto: CreateWorkerAssignmentDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('project_id') projectId: string) {
    return this.service.findAllByProject(projectId);
  }

  @Get('summary/:projectId')
  getSummary(@Param('projectId') projectId: string) {
    return this.service.getSummaryByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkerAssignmentDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
