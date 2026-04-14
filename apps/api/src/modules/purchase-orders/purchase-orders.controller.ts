import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  ReceiveDeliveryDto,
  MatchInvoiceDto,
} from './dto/purchase-order.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('purchase-orders')
@UseGuards(SupabaseAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.company_id);
  }

  @Get()
  async findAll(
    @Query('project_id') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findAll(user.company_id, projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.company_id);
  }

  @Post(':id/receive')
  async receiveDelivery(
    @Param('id') id: string,
    @Body() dto: ReceiveDeliveryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.receiveDelivery(id, dto, user.company_id);
  }

  @Post(':id/match-invoice')
  async matchInvoice(
    @Param('id') id: string,
    @Body() dto: MatchInvoiceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.matchInvoice(id, dto, user.company_id);
  }

  @Get(':id/match-status')
  async getMatchStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getMatchStatus(id, user.company_id);
  }

  @Get('project/:projectId/summary')
  async getProjectSummary(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getProjectMatchSummary(projectId, user.company_id);
  }
}
