import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BimModelsService } from './bim-models.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('bim/models')
@UseGuards(SupabaseAuthGuard)
export class BimModelsController {
  constructor(private readonly service: BimModelsService) {}

  @Get()
  async getModels(@Query('projectId') projectId: string) {
    return this.service.getModelsByProject(projectId);
  }

  @Post()
  async createModel(@Body('projectId') projectId: string, @Body() dto: any) {
    return this.service.createModel(projectId, dto);
  }

  @Delete(':id')
  async deleteModel(@Param('id') id: string) {
    return this.service.deleteModel(id);
  }
}
