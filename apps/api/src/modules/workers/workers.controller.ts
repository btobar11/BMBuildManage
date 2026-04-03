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
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('workers')
@UseGuards(SupabaseAuthGuard)
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  create(@Body() createWorkerDto: CreateWorkerDto, @Req() req: any) {
    createWorkerDto.company_id = req.user.company_id;
    return this.workersService.create(createWorkerDto);
  }

  @Get()
  findAll(@Req() req: any, @Query('project_id') projectId?: string) {
    return this.workersService.findAll(req.user.company_id, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.workersService.findOne(id, req.user.company_id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateWorkerDto: UpdateWorkerDto,
  ) {
    return this.workersService.update(id, req.user.company_id, updateWorkerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.workersService.remove(id, req.user.company_id);
  }
}
