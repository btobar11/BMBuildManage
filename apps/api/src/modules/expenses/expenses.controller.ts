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
  Req,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('expenses')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.ENGINEER)
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req: any) {
    createExpenseDto.company_id = req.user.company_id;
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  findAll(@Req() req: any, @Query('project_id') projectId: string) {
    return this.expensesService.findAllByProject(
      projectId,
      req.user.company_id,
    );
  }

  @Get('summary/:projectId')
  getSummary(@Param('projectId') projectId: string) {
    return this.expensesService.getSummaryByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.ENGINEER)
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTING)
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
