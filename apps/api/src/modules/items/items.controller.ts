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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('items')
@UseGuards(SupabaseAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  findAll(@Query('stage_id') stageId: string) {
    return this.itemsService.findAllByStage(stageId);
  }

  @Get('budget/:project_id')
  findAllByProject(
    @Param('project_id') projectId: string,
    @Query('search') search?: string,
  ) {
    return this.itemsService.findAllByProject(projectId, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Req() req: any,
  ) {
    return this.itemsService.update(
      id,
      updateItemDto,
      req.user?.id,
      req.user?.company_id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
