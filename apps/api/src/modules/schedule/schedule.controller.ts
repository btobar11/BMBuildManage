import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { TaskStatus, TaskPriority } from './schedule.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class CreateTaskDto {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  parent_id?: string;
  assigned_to?: string;
}

class UpdateTaskDto {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
}

class CreateMilestoneDto {
  name: string;
  description?: string;
  target_date: string;
}

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get(':projectId')
  @UseGuards(SupabaseAuthGuard)
  async getSchedule(@Param('projectId') projectId: string) {
    return this.scheduleService.getProjectSchedule(projectId);
  }

  @Get(':projectId/gantt')
  @UseGuards(SupabaseAuthGuard)
  async getGanttData(@Param('projectId') projectId: string) {
    return this.scheduleService.getGanttData(projectId);
  }

  @Get(':projectId/metrics')
  @UseGuards(SupabaseAuthGuard)
  async getMetrics(@Param('projectId') projectId: string) {
    return this.scheduleService.calculateScheduleMetrics(projectId);
  }

  @Post(':projectId/tasks')
  @UseGuards(SupabaseAuthGuard)
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.scheduleService.createTask(projectId, {
      ...dto,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
      priority: dto.priority ? TaskPriority[dto.priority.toUpperCase() as keyof typeof TaskPriority] : undefined,
    });
  }

  @Patch('tasks/:taskId')
  @UseGuards(SupabaseAuthGuard)
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.scheduleService.updateTask(taskId, {
      ...dto,
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      status: dto.status ? TaskStatus[dto.status.toUpperCase().replace('_', '') as keyof typeof TaskStatus] : undefined,
      priority: dto.priority ? TaskPriority[dto.priority.toUpperCase() as keyof typeof TaskPriority] : undefined,
    });
  }

  @Delete('tasks/:taskId')
  @UseGuards(SupabaseAuthGuard)
  async deleteTask(@Param('taskId') taskId: string) {
    return this.scheduleService.deleteTask(taskId);
  }

  @Post(':projectId/milestones')
  @UseGuards(SupabaseAuthGuard)
  async createMilestone(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.scheduleService.createMilestone(projectId, {
      ...dto,
      target_date: new Date(dto.target_date),
    });
  }

  @Patch('milestones/:milestoneId')
  @UseGuards(SupabaseAuthGuard)
  async updateMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() dto: any,
  ) {
    if (dto.target_date) dto.target_date = new Date(dto.target_date);
    return this.scheduleService.updateMilestone(milestoneId, dto);
  }
}