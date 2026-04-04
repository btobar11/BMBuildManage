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
import { WorkerPaymentsService } from './worker-payments.service';
import { CreateWorkerPaymentDto } from './dto/create-worker-payment.dto';
import { UpdateWorkerPaymentDto } from './dto/update-worker-payment.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('worker-payments')
@UseGuards(SupabaseAuthGuard)
export class WorkerPaymentsController {
  constructor(private readonly service: WorkerPaymentsService) {}

  @Post()
  create(@Body() createDto: CreateWorkerPaymentDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('project_id') projectId: string) {
    return this.service.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateWorkerPaymentDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
