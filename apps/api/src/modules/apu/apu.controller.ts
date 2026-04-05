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
import { ApuService } from './apu.service';
import { CreateApuTemplateDto } from './dto/create-apu-template.dto';
import { UpdateApuTemplateDto } from './dto/update-apu-template.dto';

@Controller('apu')
export class ApuController {
  constructor(private readonly apuService: ApuService) {}

  @Post()
  create(@Body() dto: CreateApuTemplateDto) {
    return this.apuService.create(dto);
  }

  @Post('import')
  importMany(@Body() dtos: CreateApuTemplateDto[]) {
    return Promise.all(dtos.map(dto => this.apuService.create(dto)));
  }

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('search') search?: string,
    @Query('tab') tab?: 'personal' | 'global',
  ) {
    return this.apuService.findAll(companyId, search, tab);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.apuService.findOne(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.apuService.duplicate(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApuTemplateDto,
  ) {
    return this.apuService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apuService.remove(id);
  }
}
