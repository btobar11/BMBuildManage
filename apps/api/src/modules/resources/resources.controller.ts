import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Post('bulk')
  bulkCreate(@Body() items: CreateResourceDto[]) {
    return this.resourcesService.bulkCreate(items);
  }

  @Get()
  findAll(@Query('company_id') companyId?: string, @Query('tab') tab?: string) {
    return this.resourcesService.findAll({ companyId, tab });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.findHistory(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.remove(id);
  }
}
