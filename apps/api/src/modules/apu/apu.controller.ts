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
import { ApuService } from './apu.service';
import { CreateApuTemplateDto } from './dto/create-apu-template.dto';
import { UpdateApuTemplateDto } from './dto/update-apu-template.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@Controller('apu')
@UseGuards(SupabaseAuthGuard)
export class ApuController {
  constructor(private readonly apuService: ApuService) {}

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @Body() dto: CreateApuTemplateDto,
  ) {
    return this.apuService.create(companyId, dto);
  }

  @Post('import')
  importMany(
    @CurrentCompany() companyId: string,
    @Body() dtos: CreateApuTemplateDto[],
  ) {
    return Promise.all(
      dtos.map((dto) => this.apuService.create(companyId, dto)),
    );
  }

  @Post('seed')
  importGlobalLibrary(@CurrentCompany() companyId: string) {
    return this.apuService.importGlobalLibrary(companyId);
  }

  @Get()
  findAll(
    @CurrentCompany() companyId: string,
    @Query('search') search?: string,
    @Query('tab') tab?: 'personal' | 'global',
  ) {
    return this.apuService.findAll(companyId, search, tab);
  }

  @Get(':id')
  findOne(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apuService.findOne(companyId, id);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apuService.duplicate(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApuTemplateDto,
  ) {
    return this.apuService.update(companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentCompany() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apuService.remove(companyId, id);
  }
}
