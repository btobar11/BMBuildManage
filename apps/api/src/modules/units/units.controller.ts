import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UnitsService } from './units.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('units')
@UseGuards(SupabaseAuthGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.unitsService.create(data);
  }
}
