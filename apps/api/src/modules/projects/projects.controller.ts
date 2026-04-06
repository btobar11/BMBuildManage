import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('projects')
@UseGuards(SupabaseAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    createProjectDto.company_id = req.user.company_id;
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user.company_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.findOne(id, req.user.company_id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ) {
    return this.projectsService.update(
      id,
      req.user.company_id,
      updateProjectDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.remove(id, req.user.company_id);
  }

  @Post('bulk-delete')
  bulkRemove(@Body('ids') ids: string[], @Request() req: any) {
    return this.projectsService.bulkRemove(ids, req.user.company_id);
  }

  @Patch('bulk-update-folder')
  bulkUpdateFolder(
    @Body() data: { ids: string[]; folder: string | null },
    @Request() req: any,
  ) {
    return this.projectsService.bulkUpdateFolder(
      data.ids,
      data.folder,
      req.user.company_id,
    );
  }

  // Payments endpoints
  @Post(':id/payments')
  addPayment(
    @Param('id') projectId: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.projectsService.addPayment(
      projectId,
      req.user.company_id,
      data,
    );
  }

  @Get(':id/payments')
  findPayments(@Param('id') projectId: string, @Request() req: any) {
    return this.projectsService.findPayments(projectId, req.user.company_id);
  }

  @Delete('payments/:paymentId')
  removePayment(@Param('paymentId') paymentId: string, @Request() req: any) {
    return this.projectsService.removePayment(paymentId, req.user.company_id);
  }
}
