import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('clients')
@UseGuards(SupabaseAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Request() req: any) {
    createClientDto.company_id = req.user.company_id;
    return this.clientsService.create(createClientDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.clientsService.findAll(req.user.company_id);
  }

  @Get('search')
  search(@Query('search') search: string, @Request() req: any) {
    return this.clientsService.search(req.user.company_id, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.findOne(id, req.user.company_id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req: any,
  ) {
    return this.clientsService.update(id, req.user.company_id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.remove(id, req.user.company_id);
  }
}
