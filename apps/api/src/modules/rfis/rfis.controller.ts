import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RfisService } from './rfis.service';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('rfis')
@UseGuards(SupabaseAuthGuard)
export class RfisController {
  constructor(private readonly rfisService: RfisService) {}

  @Post()
  create(@Body() createRfiDto: CreateRfiDto) {
    return this.rfisService.create(createRfiDto);
  }

  @Get()
  findAll(@Query('project_id') projectId: string) {
    return this.rfisService.findAll(projectId);
  }

  @Get('stats')
  getStats(@Query('project_id') projectId: string) {
    return this.rfisService.getStats(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rfisService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRfiDto: UpdateRfiDto) {
    return this.rfisService.update(id, updateRfiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rfisService.remove(id);
  }
}
