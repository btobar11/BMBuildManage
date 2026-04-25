import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@Controller('materials')
@UseGuards(SupabaseAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @Body() createMaterialDto: CreateMaterialDto,
  ) {
    return this.materialsService.create(companyId, createMaterialDto);
  }

  @Get()
  findAll(
    @CurrentCompany() companyId: string,
    @Query('search') search: string,
  ) {
    return this.materialsService.findAll(companyId, search);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.materialsService.findOne(companyId, id);
  }

  @Delete(':id')
  remove(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.materialsService.remove(companyId, id);
  }
}
