import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MachineryService } from './machinery.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@Controller('machinery')
@UseGuards(SupabaseAuthGuard)
export class MachineryController {
  constructor(private readonly machineryService: MachineryService) {}

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @Body() createMachineryDto: CreateMachineryDto,
  ) {
    return this.machineryService.create(companyId, createMachineryDto);
  }

  @Get()
  findAll(@CurrentCompany() companyId: string) {
    return this.machineryService.findAllByCompany(companyId);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.machineryService.findOne(companyId, id);
  }

  @Delete(':id')
  remove(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.machineryService.remove(companyId, id);
  }
}
