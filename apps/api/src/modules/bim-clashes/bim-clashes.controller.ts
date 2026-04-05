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
  Query,
} from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { CreateClashJobDto } from './dto/create-clash-job.dto';
import { UpdateClashDto } from './dto/update-clash.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('bim-clashes')
@UseGuards(SupabaseAuthGuard)
export class BimClashesController {
  constructor(private readonly bimClashesService: BimClashesService) {}

  @Post('jobs')
  createJob(@Body() createClashJobDto: CreateClashJobDto, @Request() req: any) {
    return this.bimClashesService.createJob({
      ...createClashJobDto,
      company_id: req.user.company_id,
    });
  }

  @Get('jobs')
  findAllJobs(@Request() req: any) {
    return this.bimClashesService.findAllJobs(req.user.company_id);
  }

  @Get('jobs/:id')
  findOneJob(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.findOneJob(id, req.user.company_id);
  }

  @Get('jobs/:id/status')
  getJobStatus(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.getJobStatus(id, req.user.company_id);
  }

  @Get()
  findAllClashes(
    @Request() req: any,
    @Query('projectId') projectId?: string,
    @Query('modelId') modelId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
  ) {
    return this.bimClashesService.findAllClashes(req.user.company_id, {
      projectId,
      modelId,
      status,
      severity,
      type,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.findOne(id, req.user.company_id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClashDto: UpdateClashDto,
    @Request() req: any,
  ) {
    return this.bimClashesService.update(id, req.user.company_id, updateClashDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.remove(id, req.user.company_id);
  }

  @Delete('by-job/:jobId')
  removeByJob(@Param('jobId') jobId: string, @Request() req: any) {
    return this.bimClashesService.removeByJob(jobId, req.user.company_id);
  }

  @Get('stats/summary')
  getClashSummary(@Request() req: any, @Query('projectId') projectId: string) {
    return this.bimClashesService.getClashSummary(req.user.company_id, projectId);
  }
}
