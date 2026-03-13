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
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('workers')
@UseGuards(SupabaseAuthGuard)
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  create(@Body() createWorkerDto: CreateWorkerDto) {
    return this.workersService.create(createWorkerDto);
  }

  @Get()
  findAll(@Query('company_id') companyId: string) {
    return this.workersService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('company_id') companyId: string) {
    return this.workersService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('company_id') companyId: string,
    @Body() updateWorkerDto: UpdateWorkerDto,
  ) {
    return this.workersService.update(id, companyId, updateWorkerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('company_id') companyId: string) {
    return this.workersService.remove(id, companyId);
  }
}
