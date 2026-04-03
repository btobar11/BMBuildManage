import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { CreateExecutionLogDto } from './dto/create-execution-log.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('execution-logs')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.ARCHITECT, UserRole.SITESUPERVISOR, UserRole.FOREMAN)
  create(@Body() dto: CreateExecutionLogDto, @Req() req: any) {
    return this.executionService.create(dto, req.user?.id);
  }

  @Get('by-item/:itemId')
  findByItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.executionService.findByItem(itemId);
  }

  @Get('by-budget/:budgetId')
  findByBudget(@Param('budgetId', ParseUUIDPipe) budgetId: string) {
    return this.executionService.findByBudget(budgetId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.executionService.remove(id);
  }
}
