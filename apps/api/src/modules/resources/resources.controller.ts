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
  UseGuards,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@Controller('resources')
@UseGuards(SupabaseAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  create(@CurrentCompany() companyId: string, @Body() dto: CreateResourceDto) {
    return this.resourcesService.create(companyId, dto);
  }

  @Post('bulk')
  bulkCreate(
    @CurrentCompany() companyId: string,
    @Body() items: CreateResourceDto[],
  ) {
    return this.resourcesService.bulkCreate(companyId, items);
  }

  @Get()
  findAll(@CurrentCompany() companyId: string, @Query('tab') tab?: string) {
    return this.resourcesService.findAll({ companyId, tab });
  }

  @Get(':id')
  findOne(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resourcesService.findOne(companyId, id);
  }

  @Get(':id/history')
  getHistory(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resourcesService.findHistory(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resourcesService.remove(companyId, id);
  }
}
