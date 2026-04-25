import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(SupabaseAuthGuard)
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ) {
    try {
      createProjectDto.company_id = req.user.company_id;
      return await this.projectsService.create(createProjectDto);
    } catch (error) {
      const err = error;
      this.logger.error('Project create failed', err?.stack || err);
      throw new BadRequestException({
        message: err?.message,
        validationError: err?.response?.error?.issues || err?.response?.message,
      });
    }
  }

  @Get()
  async findAll(@Request() req: any) {
    try {
      return await this.projectsService.findAll(req.user.company_id);
    } catch (error) {
      const err = error;
      this.logger.error('Projects list failed', err?.stack || err);
      throw new BadRequestException(err?.message);
    }
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
