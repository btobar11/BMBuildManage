import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleTask, ScheduleMilestone, ScheduleResource, TaskStatus, TaskPriority } from './schedule.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleTask)
    private readonly taskRepository: Repository<ScheduleTask>,
    @InjectRepository(ScheduleMilestone)
    private readonly milestoneRepository: Repository<ScheduleMilestone>,
    @InjectRepository(ScheduleResource)
    private readonly resourceRepository: Repository<ScheduleResource>,
  ) {}

  async getProjectSchedule(projectId: string) {
    const tasks = await this.taskRepository.find({
      where: { project_id: projectId },
      order: { start_date: 'ASC', position: 'ASC' },
    });

    const milestones = await this.milestoneRepository.find({
      where: { project_id: projectId },
      order: { target_date: 'ASC' },
    });

    const resources = await this.resourceRepository.find({
      where: { project_id: projectId },
    });

    const criticalPath = this.calculateCriticalPath(tasks);

    return {
      tasks,
      milestones,
      resources,
      criticalPath,
      stats: this.calculateStats(tasks, milestones),
    };
  }

  private calculateCriticalPath(tasks: ScheduleTask[]): string[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const criticalTasks: string[] = [];

    const sorted = [...tasks].sort((a, b) => 
      new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    );

    let maxEnd = 0;
    for (const task of sorted) {
      const endTime = new Date(task.end_date).getTime();
      if (endTime >= maxEnd) {
        maxEnd = endTime;
        criticalTasks.push(task.id);
      }
    }

    return criticalTasks;
  }

  private calculateStats(tasks: ScheduleTask[], milestones: ScheduleMilestone[]) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const delayed = tasks.filter(t => t.status === TaskStatus.DELAYED).length;

    const completedMilestones = milestones.filter(m => m.completed).length;

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      delayedTasks: delayed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalMilestones: milestones.length,
      completedMilestones,
    };
  }

  async createTask(projectId: string, data: Partial<ScheduleTask>) {
    const task = this.taskRepository.create({
      ...data,
      project_id: projectId,
    });
    return this.taskRepository.save(task);
  }

  async updateTask(taskId: string, data: Partial<ScheduleTask>) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    Object.assign(task, data);

    if (data.progress !== undefined && data.progress >= 100) {
      task.status = TaskStatus.COMPLETED;
    }

    return this.taskRepository.save(task);
  }

  async deleteTask(taskId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    
    await this.taskRepository.remove(task);
    return { success: true };
  }

  async createMilestone(projectId: string, data: Partial<ScheduleMilestone>) {
    const milestone = this.milestoneRepository.create({
      ...data,
      project_id: projectId,
    });
    return this.milestoneRepository.save(milestone);
  }

  async updateMilestone(milestoneId: string, data: Partial<ScheduleMilestone>) {
    const milestone = await this.milestoneRepository.findOne({ where: { id: milestoneId } });
    if (!milestone) throw new NotFoundException('Hito no encontrado');

    Object.assign(milestone, data);
    return this.milestoneRepository.save(milestone);
  }

  async addResource(projectId: string, data: Partial<ScheduleResource>) {
    const resource = this.resourceRepository.create({
      ...data,
      project_id: projectId,
    });
    return this.resourceRepository.save(resource);
  }

  async getGanttData(projectId: string) {
    const tasks = await this.taskRepository.find({
      where: { project_id: projectId },
      order: { position: 'ASC' },
    });

    const milestones = await this.milestoneRepository.find({
      where: { project_id: projectId },
    });

    return {
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.name,
        start: t.start_date,
        end: t.end_date,
        progress: t.progress,
        status: t.status,
        priority: t.priority,
        dependencies: t.dependency_days,
      })),
      milestones: milestones.map(m => ({
        id: m.id,
        name: m.name,
        date: m.target_date,
        completed: m.completed,
      })),
    };
  }

  async calculateScheduleMetrics(projectId: string) {
    const tasks = await this.taskRepository.find({
      where: { project_id: projectId },
    });

    const totalDuration = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const completedDuration = tasks
      .filter(t => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    const criticalPath = this.calculateCriticalPath(tasks);
    const criticalDuration = tasks
      .filter(t => criticalPath.includes(t.id))
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    return {
      totalDuration,
      completedDuration,
      remainingDuration: totalDuration - completedDuration,
      completionPercentage: totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0,
      criticalPathLength: criticalDuration,
      taskCount: tasks.length,
    };
  }
}