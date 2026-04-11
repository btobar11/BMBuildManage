import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { BimApuLinkService, LinkBimElementDto } from './bim-apu-link.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class LinkElementDto {
  @IsUUID()
  project_id!: string;

  @IsUUID()
  item_id!: string;

  @IsString()
  ifc_global_id!: string;

  @IsOptional()
  @IsString()
  ifc_type?: string;

  @IsOptional()
  @IsString()
  element_name?: string;

  @IsOptional()
  @IsEnum(['volume', 'area', 'length', 'count'])
  quantity_type?: 'volume' | 'area' | 'length' | 'count';

  @IsOptional()
  quantity_multiplier?: number;

  @IsOptional()
  @IsBoolean()
  auto_sync_enabled?: boolean;
}

class QueryDto {
  @IsUUID()
  project_id!: string;
}

@Controller('bim-apu-link')
@UseGuards(SupabaseAuthGuard)
export class BimApuLinkController {
  constructor(private readonly service: BimApuLinkService) {}

  /**
   * Link BIM element to budget item
   */
  @Post()
  async linkElement(
    @CurrentUser() user: any,
    @Body() dto: LinkElementDto,
  ) {
    const link = await this.service.linkElement(
      user.company_id,
      dto,
      user.id,
    );

    return {
      success: true,
      data: link,
      message: 'Element linked successfully',
    };
  }

  /**
   * Get all links for a project
   */
  @Get('project/:project_id')
  async getLinksByProject(
    @CurrentUser() user: any,
    @Param('project_id') projectId: string,
  ) {
    const links = await this.service.getLinksByProject(
      user.company_id,
      projectId,
    );

    return {
      success: true,
      data: links,
    };
  }

  /**
   * Get links by item
   */
  @Get('item/:item_id')
  async getLinksByItem(
    @CurrentUser() user: any,
    @Param('item_id') itemId: string,
  ) {
    const links = await this.service.getLinksByItem(
      user.company_id,
      itemId,
    );

    return {
      success: true,
      data: links,
    };
  }

  /**
   * Sync all quantities for a project
   */
  @Post('sync/:project_id')
  async syncProject(
    @CurrentUser() user: any,
    @Param('project_id') projectId: string,
  ) {
    const results = await this.service.syncProjectQuantities(
      user.company_id,
      projectId,
      user.id,
    );

    return {
      success: true,
      data: results,
      message: `Synced ${results.length} items`,
    };
  }

  /**
   * Get sync status
   */
  @Get('status/:project_id')
  async getSyncStatus(
    @CurrentUser() user: any,
    @Param('project_id') projectId: string,
  ) {
    const status = await this.service.getSyncStatus(
      user.company_id,
      projectId,
    );

    return {
      success: true,
      data: status,
    };
  }

  /**
   * Unlink BIM element
   */
  @Delete(':link_id')
  async unlinkElement(
    @CurrentUser() user: any,
    @Param('link_id') linkId: string,
  ) {
    await this.service.unlinkElement(
      user.company_id,
      linkId,
    );

    return {
      success: true,
      message: 'Link removed successfully',
    };
  }
}