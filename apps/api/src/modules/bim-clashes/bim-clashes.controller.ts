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
import { CreateFederatedClashJobDto } from './dto/create-federated-clash-job.dto';
import {
  UpdateFederatedClashDto,
  AddClashCommentDto,
} from './dto/update-federated-clash.dto';
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
    return this.bimClashesService.update(
      id,
      req.user.company_id,
      updateClashDto,
    );
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
    return this.bimClashesService.getClashSummary(
      req.user.company_id,
      projectId,
    );
  }

  // Federated Clash Detection Endpoints

  @Post('federated/jobs')
  createFederatedJob(
    @Body() createFederatedJobDto: CreateFederatedClashJobDto,
    @Request() req: any,
  ) {
    return this.bimClashesService.createFederatedJob({
      ...createFederatedJobDto,
      company_id: req.user.company_id,
    });
  }

  @Get('federated/jobs')
  findAllFederatedJobs(@Request() req: any) {
    return this.bimClashesService.findAllFederatedJobs(req.user.company_id);
  }

  @Get('federated/jobs/:id')
  findOneFederatedJob(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.findOneFederatedJob(id, req.user.company_id);
  }

  @Post('federated/jobs/:id/start')
  startFederatedJob(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.startFederatedClashDetection(
      id,
      req.user.company_id,
    );
  }

  @Get('federated/jobs/:id/progress')
  getFederatedJobProgress(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.getFederatedJobProgress(
      id,
      req.user.company_id,
    );
  }

  @Get('federated/clashes')
  findFederatedClashes(
    @Request() req: any,
    @Query('federationJobId') federationJobId?: string,
    @Query('disciplineA') disciplineA?: string,
    @Query('disciplineB') disciplineB?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.bimClashesService.findFederatedClashes(req.user.company_id, {
      federationJobId,
      disciplineA,
      disciplineB,
      status,
      severity,
    });
  }

  @Patch('federated/clashes/:id')
  updateFederatedClash(
    @Param('id') id: string,
    @Body() updateDto: UpdateFederatedClashDto,
    @Request() req: any,
  ) {
    return this.bimClashesService.updateFederatedClash(
      id,
      req.user.company_id,
      updateDto,
    );
  }

  @Post('federated/clashes/:id/comments')
  addClashComment(
    @Param('id') id: string,
    @Body() commentDto: AddClashCommentDto,
    @Request() req: any,
  ) {
    return this.bimClashesService.addClashComment(
      id,
      req.user.company_id,
      commentDto,
    );
  }

  @Get('federated/clashes/:id/comments')
  getClashComments(@Param('id') id: string, @Request() req: any) {
    return this.bimClashesService.getClashComments(id, req.user.company_id);
  }
}
