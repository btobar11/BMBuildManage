import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ClashJobResult {
  clashId: string;
  elementAId: string;
  elementAGuid: string;
  elementBId: string;
  elementBGuid: string;
  clashType: 'hard' | 'soft' | 'clearance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  intersectionVolume?: number;
  clearanceDistance?: number;
}

export interface ClashJob {
  id: string;
  company_id: string;
  project_id: string;
  model_a_id: string;
  model_b_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  clashes_found: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface Clash {
  id: string;
  company_id: string;
  model_a_id: string;
  model_b_id: string;
  element_a_id: string;
  element_b_id: string;
  element_a_guid: string;
  element_b_guid: string;
  clash_type: 'hard' | 'soft' | 'clearance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'resolved' | 'ignored';
  intersection_volume: number | null;
  clearance_distance: number | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

interface BimElement {
  id: string;
  ifc_guid: string;
  bounding_box: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  } | null;
}

@Injectable()
export class BimClashesService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') || process.env.SUPABASE_URL || '',
      this.configService.get<string>('supabase.anonKey') || process.env.SUPABASE_ANON_KEY || '',
    );
  }

  async createJob(data: { company_id: string; project_id: string; model_a_id: string; model_b_id: string }): Promise<ClashJob> {
    const { data: job, error } = await this.supabase
      .from('bim_clash_jobs')
      .insert({
        company_id: data.company_id,
        project_id: data.project_id,
        model_a_id: data.model_a_id,
        model_b_id: data.model_b_id,
        status: 'pending',
        progress: 0,
        clashes_found: 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create clash job: ${error.message}`);
    return job as ClashJob;
  }

  async findAllJobs(companyId: string): Promise<ClashJob[]> {
    const { data, error } = await this.supabase
      .from('bim_clash_jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch clash jobs: ${error.message}`);
    return (data || []) as ClashJob[];
  }

  async findOneJob(id: string, companyId: string): Promise<ClashJob | null> {
    const { data, error } = await this.supabase
      .from('bim_clash_jobs')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch clash job: ${error.message}`);
    }
    return data as ClashJob | null;
  }

  async getJobStatus(id: string, companyId: string): Promise<{ status: string; progress: number }> {
    const job = await this.findOneJob(id, companyId);
    if (!job) throw new Error('Job not found');
    return { status: job.status, progress: job.progress };
  }

  async findAllClashes(
    companyId: string,
    filters: {
      projectId?: string;
      modelId?: string;
      status?: string;
      severity?: string;
      type?: string;
    }
  ): Promise<Clash[]> {
    let query = this.supabase
      .from('bim_clashes')
      .select('*')
      .eq('company_id', companyId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.type) {
      query = query.eq('clash_type', filters.type);
    }

    const { data, error } = await query.order('detected_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch clashes: ${error.message}`);

    let clashes = (data || []) as Clash[];

    if (filters.modelId) {
      clashes = clashes.filter(
        (c: Clash) => c.model_a_id === filters.modelId || c.model_b_id === filters.modelId
      );
    }

    return clashes;
  }

  async findOne(id: string, companyId: string): Promise<Clash | null> {
    const { data, error } = await this.supabase
      .from('bim_clashes')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch clash: ${error.message}`);
    }
    return data as Clash | null;
  }

  async update(id: string, companyId: string, data: Partial<Clash>): Promise<Clash> {
    const updateData: Record<string, unknown> = { ...data };
    
    if (data.status === 'resolved' || data.status === 'ignored') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: clash, error } = await this.supabase
      .from('bim_clashes')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update clash: ${error.message}`);
    return clash as Clash;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bim_clashes')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw new Error(`Failed to delete clash: ${error.message}`);
  }

  async removeByJob(jobId: string, companyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bim_clashes')
      .delete()
      .eq('model_a_id', jobId)
      .eq('company_id', companyId);

    if (error) throw new Error(`Failed to delete clashes by job: ${error.message}`);
  }

  async getClashSummary(companyId: string, projectId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalClashes: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const { data: jobs } = await this.supabase
      .from('bim_clash_jobs')
      .select('*')
      .eq('company_id', companyId)
      .eq('project_id', projectId);

    const { data: clashes } = await this.supabase
      .from('bim_clashes')
      .select('*')
      .eq('company_id', companyId);

    const jobsList = (jobs || []) as ClashJob[];
    const clashesList = (clashes || []) as Clash[];

    return {
      totalJobs: jobsList.length,
      completedJobs: jobsList.filter((j: ClashJob) => j.status === 'completed').length,
      failedJobs: jobsList.filter((j: ClashJob) => j.status === 'failed').length,
      totalClashes: clashesList.length,
      byStatus: {
        pending: clashesList.filter((c: Clash) => c.status === 'pending').length,
        accepted: clashesList.filter((c: Clash) => c.status === 'accepted').length,
        resolved: clashesList.filter((c: Clash) => c.status === 'resolved').length,
        ignored: clashesList.filter((c: Clash) => c.status === 'ignored').length,
      },
      bySeverity: {
        critical: clashesList.filter((c: Clash) => c.severity === 'critical').length,
        high: clashesList.filter((c: Clash) => c.severity === 'high').length,
        medium: clashesList.filter((c: Clash) => c.severity === 'medium').length,
        low: clashesList.filter((c: Clash) => c.severity === 'low').length,
      },
      byType: {
        hard: clashesList.filter((c: Clash) => c.clash_type === 'hard').length,
        soft: clashesList.filter((c: Clash) => c.clash_type === 'soft').length,
        clearance: clashesList.filter((c: Clash) => c.clash_type === 'clearance').length,
      },
    };
  }

  async runClashDetection(jobId: string): Promise<void> {
    const job = await this.findOneJob(jobId, '');
    if (!job) throw new Error('Job not found');

    try {
      await this.supabase
        .from('bim_clash_jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', jobId);

      const clashes = await this.performClashDetection(job);

      await this.supabase
        .from('bim_clash_jobs')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          clashes_found: clashes.length,
          progress: 100,
        })
        .eq('id', jobId);
    } catch (error) {
      await this.supabase
        .from('bim_clash_jobs')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }

  private async performClashDetection(job: ClashJob): Promise<ClashJobResult[]> {
    const clashes: ClashJobResult[] = [];

    const { data: elementsA } = await this.supabase
      .from('bim_elements')
      .select('*')
      .eq('model_id', job.model_a_id);

    const { data: elementsB } = await this.supabase
      .from('bim_elements')
      .select('*')
      .eq('model_id', job.model_b_id);

    if (!elementsA || !elementsB) {
      return clashes;
    }

    const elementsAList = elementsA as BimElement[];
    const elementsBList = elementsB as BimElement[];

    const totalPairs = elementsAList.length * elementsBList.length;
    let processed = 0;

    for (const elemA of elementsAList) {
      for (const elemB of elementsBList) {
        const clash = this.checkBoundingBoxClash(elemA, elemB);
        if (clash) {
          clashes.push({
            clashId: crypto.randomUUID(),
            elementAId: elemA.id,
            elementAGuid: elemA.ifc_guid,
            elementBId: elemB.id,
            elementBGuid: elemB.ifc_guid,
            ...clash,
          });
        }

        processed++;
        const progress = Math.floor((processed / totalPairs) * 100);
        if (processed % 100 === 0) {
          await this.supabase
            .from('bim_clash_jobs')
            .update({ progress })
            .eq('id', job.id);
        }
      }
    }

    for (const clash of clashes) {
      await this.supabase.from('bim_clashes').insert({
        company_id: job.company_id,
        model_a_id: job.model_a_id,
        model_b_id: job.model_b_id,
        element_a_id: clash.elementAId,
        element_b_id: clash.elementBId,
        element_a_guid: clash.elementAGuid,
        element_b_guid: clash.elementBGuid,
        clash_type: clash.clashType,
        severity: clash.severity,
        intersection_volume: clash.intersectionVolume || null,
        clearance_distance: clash.clearanceDistance || null,
        status: 'pending',
      });
    }

    return clashes;
  }

  private checkBoundingBoxClash(
    elemA: BimElement,
    elemB: BimElement
  ): { clashType: 'hard' | 'soft'; severity: 'low' | 'medium' | 'high' | 'critical'; intersectionVolume?: number } | null {
    const boxA = elemA.bounding_box;
    const boxB = elemB.bounding_box;

    if (!boxA || !boxB) return null;

    const overlapX = this.getOverlap(boxA.minX, boxA.maxX, boxB.minX, boxB.maxX);
    const overlapY = this.getOverlap(boxA.minY, boxA.maxY, boxB.minY, boxB.maxY);
    const overlapZ = this.getOverlap(boxA.minZ, boxA.maxZ, boxB.minZ, boxB.maxZ);

    if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
      const volume = overlapX * overlapY * overlapZ;
      return {
        clashType: 'hard',
        severity: this.getSeverityFromVolume(volume),
        intersectionVolume: volume,
      };
    }

    return null;
  }

  private getOverlap(aMin: number, aMax: number, bMin: number, bMax: number): number {
    return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
  }

  private getSeverityFromVolume(volume: number): 'low' | 'medium' | 'high' | 'critical' {
    if (volume > 10) return 'critical';
    if (volume > 1) return 'high';
    if (volume > 0.1) return 'medium';
    return 'low';
  }
}
