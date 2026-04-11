import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { BimApuLink } from './bim-apu-link.entity';
import { Item } from '../items/item.entity';
import { Stage } from '../stages/stage.entity';
import { Budget } from '../budgets/budget.entity';

export interface LinkBimElementDto {
  project_id: string;
  item_id: string;
  ifc_global_id: string;
  ifc_type?: string;
  element_name?: string;
  quantity_type?: 'volume' | 'area' | 'length' | 'count';
  quantity_multiplier?: number;
  auto_sync_enabled?: boolean;
}

export interface BimQuantity {
  netVolume?: number;
  netArea?: number;
  grossVolume?: number;
  grossArea?: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface SyncResult {
  item_id: string;
  ifc_global_id: string;
  old_quantity: number;
  new_quantity: number;
  old_total_cost: number;
  new_total_cost: number;
  synced_at: Date;
}

@Injectable()
export class BimApuLinkService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(BimApuLink)
    private bimApuLinkRepo: Repository<BimApuLink>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(Stage)
    private stageRepo: Repository<Stage>,
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') ||
        process.env.SUPABASE_URL ||
        '',
      this.configService.get<string>('supabase.anonKey') ||
        process.env.SUPABASE_ANON_KEY ||
        '',
    );
  }

  /**
   * Link an IFC element to a budget item (APU)
   */
  async linkElement(
    companyId: string,
    dto: LinkBimElementDto,
    userId: string,
  ): Promise<BimApuLink> {
    // Verify item exists and belongs to project
    const item = await this.itemRepo.findOne({
      where: { id: dto.item_id },
      relations: ['stage', 'stage.budget'],
    });

    if (!item || !item.stage) {
      throw new NotFoundException(`Item not found: ${dto.item_id}`);
    }

    const budget = item.stage.budget;
    if (!budget || !budget.project) {
      throw new BadRequestException('Item has no budget');
    }

    const project = budget.project;
    if (project.company_id !== companyId) {
      throw new BadRequestException('Item does not belong to this company');
    }

    // Get BIM element quantities from Supabase
    const bimQuantity = await this.getBimElementQuantity(
      companyId,
      dto.ifc_global_id,
    );

    // Create link
    const link = this.bimApuLinkRepo.create({
      company_id: companyId,
      project_id: dto.project_id,
      item_id: dto.item_id,
      ifc_global_id: dto.ifc_global_id,
      ifc_type: dto.ifc_type,
      element_name: dto.element_name,
      net_volume: bimQuantity?.netVolume,
      net_area: bimQuantity?.netArea,
      gross_volume: bimQuantity?.grossVolume,
      gross_area: bimQuantity?.grossArea,
      length: bimQuantity?.length,
      width: bimQuantity?.width,
      height: bimQuantity?.height,
      quantity_type: dto.quantity_type || 'volume',
      quantity_multiplier: dto.quantity_multiplier || 1,
      auto_sync_enabled: dto.auto_sync_enabled ?? true,
      last_synced_at: new Date(),
      last_synced_by: userId,
      status: 'active',
    });

    const saved = await this.bimApuLinkRepo.save(link);

    // Initial sync to set quantity
    await this.syncItemQuantity(saved, item);

    return saved;
  }

  /**
   * Get BIM element quantities from Supabase
   */
  private async getBimElementQuantity(
    companyId: string,
    ifcGlobalId: string,
  ): Promise<BimQuantity | null> {
    const { data, error } = await this.supabase
      .from('bim_elements')
      .select(
        'net_volume, net_area, gross_volume, gross_area, length, width, height',
      )
      .eq('company_id', companyId)
      .eq('ifc_guid', ifcGlobalId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      netVolume: data.net_volume,
      netArea: data.net_area,
      grossVolume: data.gross_volume,
      grossArea: data.gross_area,
      length: data.length,
      width: data.width,
      height: data.height,
    };
  }

  /**
   * Get all links for a project
   */
  async getLinksByProject(
    companyId: string,
    projectId: string,
  ): Promise<BimApuLink[]> {
    return this.bimApuLinkRepo.find({
      where: {
        company_id: companyId,
        project_id: projectId,
        status: 'active',
      },
      relations: ['item'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get links by item
   */
  async getLinksByItem(
    companyId: string,
    itemId: string,
  ): Promise<BimApuLink[]> {
    return this.bimApuLinkRepo.find({
      where: {
        company_id: companyId,
        item_id: itemId,
        status: 'active',
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Calculate quantity from linked BIM elements
   */
  calculateBimQuantity(link: BimApuLink): number {
    let baseQuantity = 0;

    switch (link.quantity_type) {
      case 'volume':
        baseQuantity = Number(link.net_volume) || 0;
        break;
      case 'area':
        baseQuantity = Number(link.net_area) || 0;
        break;
      case 'length':
        baseQuantity = Number(link.length) || 0;
        break;
      case 'count':
        baseQuantity = 1;
        break;
    }

    return baseQuantity * Number(link.quantity_multiplier);
  }

  /**
   * Sync all linked items for a project - updates budget totals
   */
  async syncProjectQuantities(
    companyId: string,
    projectId: string,
    userId: string,
  ): Promise<SyncResult[]> {
    const links = await this.getLinksByProject(companyId, projectId);
    const results: SyncResult[] = [];

    // Group links by item_id to handle multiple BIM elements per item
    const itemLinks = new Map<string, BimApuLink[]>();
    for (const link of links) {
      const existing = itemLinks.get(link.item_id) || [];
      existing.push(link);
      itemLinks.set(link.item_id, existing);
    }

    // Sync each item
    for (const [itemId, itemLinkList] of itemLinks) {
      const item = await this.itemRepo.findOne({
        where: { id: itemId },
        relations: ['stage', 'stage.budget'],
      });

      if (!item) continue;

      const oldQuantity = Number(item.quantity);
      let newQuantity = 0;

      // Sum quantities from all linked BIM elements
      for (const link of itemLinkList) {
        // Update BIM quantities from Supabase
        const updatedLink = await this.refreshLinkQuantities(link);
        newQuantity += this.calculateBimQuantity(updatedLink);
      }

      // Apply quantity to item
      item.quantity = newQuantity;
      item.cubication_mode = 'bim' as any;
      await this.itemRepo.save(item);

      const oldTotalCost = Number(item.total_cost) || 0;
      const newTotalCost = newQuantity * Number(item.unit_cost);

      results.push({
        item_id: itemId,
        ifc_global_id: itemLinkList[0].ifc_global_id,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        old_total_cost: oldTotalCost,
        new_total_cost: newTotalCost,
        synced_at: new Date(),
      });
    }

    // Recalculate budget totals
    await this.recalculateBudgetTotals(projectId);

    return results;
  }

  /**
   * Sync single item quantity from linked BIM elements
   */
  async syncItemQuantity(
    link: BimApuLink,
    item: Item,
  ): Promise<SyncResult> {
    const oldQuantity = Number(item.quantity);
    const newQuantity = this.calculateBimQuantity(link);

    // Update item quantity
    item.quantity = newQuantity;
    item.cubication_mode = 'bim' as any;
    await this.itemRepo.save(item);

    const oldTotalCost = Number(item.total_cost) || 0;
    const newTotalCost = newQuantity * Number(item.unit_cost);

    // Update link sync timestamp
    link.last_synced_at = new Date();
    await this.bimApuLinkRepo.save(link);

    return {
      item_id: item.id,
      ifc_global_id: link.ifc_global_id,
      old_quantity: oldQuantity,
      new_quantity: newQuantity,
      old_total_cost: oldTotalCost,
      new_total_cost: newTotalCost,
      synced_at: new Date(),
    };
  }

  /**
   * Refresh BIM quantities from Supabase
   */
  private async refreshLinkQuantities(link: BimApuLink): Promise<BimApuLink> {
    const quantity = await this.getBimElementQuantity(
      link.company_id,
      link.ifc_global_id,
    );

    if (quantity) {
      link.net_volume = quantity.netVolume ?? 0;
      link.net_area = quantity.netArea ?? 0;
      link.gross_volume = quantity.grossVolume ?? 0;
      link.gross_area = quantity.grossArea ?? 0;
      link.length = quantity.length ?? 0;
      link.width = quantity.width ?? 0;
      link.height = quantity.height ?? 0;
    }

    return link;
  }

  /**
   * Recalculate budget totals after quantity sync
   */
  private async recalculateBudgetTotals(projectId: string): Promise<void> {
    const budget = await this.budgetRepo.findOne({
      where: { project_id: projectId },
    });

    if (!budget) return;

    // Get all stages and items
    const stages = await this.stageRepo.find({
      where: { budget_id: budget.id },
      relations: ['items'],
    });

    let totalCost = 0;
    let totalPrice = 0;

    for (const stage of stages) {
      for (const item of stage.items || []) {
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unit_cost);
        const unitPrice = Number(item.unit_price);

        totalCost += quantity * unitCost;
        totalPrice += quantity * unitPrice;
      }
    }

    // Update budget totals
    budget.total_estimated_cost = totalCost;
    budget.total_estimated_price = totalPrice;
    await this.budgetRepo.save(budget);
  }

  /**
   * Unlink BIM element from item
   */
  async unlinkElement(
    companyId: string,
    linkId: string,
  ): Promise<void> {
    const link = await this.bimApuLinkRepo.findOne({
      where: { id: linkId, company_id: companyId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    link.status = 'archived';
    await this.bimApuLinkRepo.save(link);
  }

  /**
   * Get sync status for project
   */
  async getSyncStatus(
    companyId: string,
    projectId: string,
  ): Promise<{
    total_links: number;
    auto_sync_enabled: number;
    last_sync: Date | null;
    items_affected: number;
  }> {
    const links = await this.getLinksByProject(companyId, projectId);

    const autoSyncEnabled = links.filter((l) => l.auto_sync_enabled).length;
    const uniqueItems = new Set(links.map((l) => l.item_id)).size;

    const lastSync = links.reduce((latest, link) => {
      if (!link.last_synced_at) return latest;
      if (!latest || link.last_synced_at > latest) {
        return link.last_synced_at;
      }
      return latest;
    }, null as Date | null);

    return {
      total_links: links.length,
      auto_sync_enabled: autoSyncEnabled,
      last_sync: lastSync,
      items_affected: uniqueItems,
    };
  }
}