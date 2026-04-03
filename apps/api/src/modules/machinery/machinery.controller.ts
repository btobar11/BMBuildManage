import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MachineryService } from './machinery.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';

@Controller('machinery')
export class MachineryController {
  constructor(private readonly machineryService: MachineryService) {}

  @Post()
  create(@Body() createMachineryDto: CreateMachineryDto) {
    return this.machineryService.create(createMachineryDto);
  }

  @Get()
  findAll(@Query('company_id') companyId: string) {
    return this.machineryService.findAllByCompany(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machineryService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machineryService.remove(id);
  }
}
