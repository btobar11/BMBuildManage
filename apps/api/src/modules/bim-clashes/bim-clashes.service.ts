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

export interface FederatedClashJob {
  id: string;
  company_id: string;
  project_id: string;
  federation_id: string;
  tolerance_mm: number;
  enabled_disciplines: string[];
  severity_threshold: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  clashes_found: number;
  models_processed: number;
  total_models: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FederatedClash extends Clash {
  federation_job_id: string;
  discipline_a: string;
  discipline_b: string;
  element_a_name: string;
  element_b_name: string;
  clash_center_x: number | null;
  clash_center_y: number | null;
  clash_center_z: number | null;
  assigned_to: string | null;
  comments: any[];
  tolerance_used: number;
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
      this.configService.get<string>('supabase.url') ||
        process.env.SUPABASE_URL ||
        '',
      this.configService.get<string>('supabase.anonKey') ||
        process.env.SUPABASE_ANON_KEY ||
        '',
    );
  }

  async createJob(data: {
    company_id: string;
    project_id: string;
    model_a_id: string;
    model_b_id: string;
  }): Promise<ClashJob> {
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

  async getJobStatus(
    id: string,
    companyId: string,
  ): Promise<{ status: string; progress: number }> {
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
    },
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

    const { data, error } = await query.order('detected_at', {
      ascending: false,
    });

    if (error) throw new Error(`Failed to fetch clashes: ${error.message}`);

    let clashes = (data || []) as Clash[];

    if (filters.modelId) {
      clashes = clashes.filter(
        (c: Clash) =>
          c.model_a_id === filters.modelId || c.model_b_id === filters.modelId,
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

  async update(
    id: string,
    companyId: string,
    data: Partial<Clash>,
  ): Promise<Clash> {
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

    if (error)
      throw new Error(`Failed to delete clashes by job: ${error.message}`);
  }

  async getClashSummary(
    companyId: string,
    projectId: string,
  ): Promise<{
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
      completedJobs: jobsList.filter((j: ClashJob) => j.status === 'completed')
        .length,
      failedJobs: jobsList.filter((j: ClashJob) => j.status === 'failed')
        .length,
      totalClashes: clashesList.length,
      byStatus: {
        pending: clashesList.filter((c: Clash) => c.status === 'pending')
          .length,
        accepted: clashesList.filter((c: Clash) => c.status === 'accepted')
          .length,
        resolved: clashesList.filter((c: Clash) => c.status === 'resolved')
          .length,
        ignored: clashesList.filter((c: Clash) => c.status === 'ignored')
          .length,
      },
      bySeverity: {
        critical: clashesList.filter((c: Clash) => c.severity === 'critical')
          .length,
        high: clashesList.filter((c: Clash) => c.severity === 'high').length,
        medium: clashesList.filter((c: Clash) => c.severity === 'medium')
          .length,
        low: clashesList.filter((c: Clash) => c.severity === 'low').length,
      },
      byType: {
        hard: clashesList.filter((c: Clash) => c.clash_type === 'hard').length,
        soft: clashesList.filter((c: Clash) => c.clash_type === 'soft').length,
        clearance: clashesList.filter(
          (c: Clash) => c.clash_type === 'clearance',
        ).length,
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
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }

  private async performClashDetection(
    job: ClashJob,
  ): Promise<ClashJobResult[]> {
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
    elemB: BimElement,
  ): {
    clashType: 'hard' | 'soft';
    severity: 'low' | 'medium' | 'high' | 'critical';
    intersectionVolume?: number;
  } | null {
    const boxA = elemA.bounding_box;
    const boxB = elemB.bounding_box;

    if (!boxA || !boxB) return null;

    const overlapX = this.getOverlap(
      boxA.minX,
      boxA.maxX,
      boxB.minX,
      boxB.maxX,
    );
    const overlapY = this.getOverlap(
      boxA.minY,
      boxA.maxY,
      boxB.minY,
      boxB.maxY,
    );
    const overlapZ = this.getOverlap(
      boxA.minZ,
      boxA.maxZ,
      boxB.minZ,
      boxB.maxZ,
    );

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

  private getOverlap(
    aMin: number,
    aMax: number,
    bMin: number,
    bMax: number,
  ): number {
    return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
  }

  private getSeverityFromVolume(
    volume: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (volume > 10) return 'critical';
    if (volume > 1) return 'high';
    if (volume > 0.1) return 'medium';
    return 'low';
  }

  // Federated Clash Detection Methods

  async createFederatedJob(data: {
    company_id: string;
    project_id: string;
    federation_id: string;
    tolerance_mm?: number;
    enabled_disciplines: string[];
    severity_threshold?: string;
  }): Promise<FederatedClashJob> {
    const { data: job, error } = await this.supabase
      .from('bim_federated_clash_jobs')
      .insert({
        company_id: data.company_id,
        project_id: data.project_id,
        federation_id: data.federation_id,
        tolerance_mm: data.tolerance_mm || 10,
        enabled_disciplines: data.enabled_disciplines,
        severity_threshold: data.severity_threshold || 'medium',
        status: 'pending',
        progress: 0,
        clashes_found: 0,
        models_processed: 0,
        total_models: 0,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create federated clash job: ${error.message}`);
    return job as FederatedClashJob;
  }

  async findAllFederatedJobs(companyId: string): Promise<FederatedClashJob[]> {
    const { data, error } = await this.supabase
      .from('bim_federated_clash_jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error)
      throw new Error(`Failed to fetch federated clash jobs: ${error.message}`);
    return (data || []) as FederatedClashJob[];
  }

  async findOneFederatedJob(
    id: string,
    companyId: string,
  ): Promise<FederatedClashJob | null> {
    const { data, error } = await this.supabase
      .from('bim_federated_clash_jobs')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch federated clash job: ${error.message}`);
    }
    return data as FederatedClashJob | null;
  }

  async startFederatedClashDetection(
    jobId: string,
    companyId: string,
  ): Promise<{ success: boolean; message: string }> {
    const job = await this.findOneFederatedJob(jobId, companyId);
    if (!job) {
      throw new Error('Federated clash job not found');
    }

    if (job.status !== 'pending') {
      throw new Error(`Job is already ${job.status}`);
    }

    // Update job status to running
    const { error: updateError } = await this.supabase
      .from('bim_federated_clash_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        progress: 0,
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to start job: ${updateError.message}`);
    }

    // Start background processing (in a real implementation, this would be a queue job)
    this.processFederatedClashDetection(jobId).catch((error) => {
      console.error('Federated clash detection failed:', error);
    });

    return { success: true, message: 'Federated clash detection started' };
  }

  private async processFederatedClashDetection(jobId: string): Promise<void> {
    try {
      const job = await this.findOneFederatedJob(jobId, '');
      if (!job) return;

      // Get all potential clash pairs using spatial indexing
      const clashPairs = [];
      let totalComparisons = 0;

      for (let i = 0; i < job.enabled_disciplines.length; i++) {
        for (let j = i + 1; j < job.enabled_disciplines.length; j++) {
          const disciplineA = job.enabled_disciplines[i];
          const disciplineB = job.enabled_disciplines[j];

          const { data: pairs, error } = await this.supabase.rpc(
            'get_potential_clash_pairs',
            {
              p_company_id: job.company_id,
              p_discipline_a: disciplineA,
              p_discipline_b: disciplineB,
              p_tolerance_mm: job.tolerance_mm,
            },
          );

          if (error) {
            console.error('Error getting clash pairs:', error);
            continue;
          }

          if (pairs) {
            clashPairs.push(
              ...pairs.map((pair: any) => ({
                ...pair,
                disciplineA,
                disciplineB,
              })),
            );
          }

          totalComparisons++;
        }
      }

      // Update total models count
      await this.supabase
        .from('bim_federated_clash_jobs')
        .update({
          total_models: job.enabled_disciplines.length,
          progress: 10,
        })
        .eq('id', jobId);

      let processedPairs = 0;
      const detectedClashes = [];

      // Process each clash pair
      for (const pair of clashPairs) {
        if (pair.overlap_volume > 0) {
          const severity = this.getSeverityFromVolume(pair.overlap_volume);
          const clashType = this.determineClashType(
            pair.disciplineA,
            pair.disciplineB,
          );

          // Only include clashes that meet the severity threshold
          if (this.meetsSeverityThreshold(severity, job.severity_threshold)) {
            detectedClashes.push({
              federation_job_id: jobId,
              company_id: job.company_id,
              element_a_id: pair.element_a_id,
              element_b_id: pair.element_b_id,
              element_a_guid: pair.element_a_guid,
              element_b_guid: pair.element_b_guid,
              discipline_a: pair.disciplineA,
              discipline_b: pair.disciplineB,
              clash_type: clashType,
              severity: severity,
              intersection_volume: pair.overlap_volume,
              tolerance_used: job.tolerance_mm,
              status: 'open',
            });
          }
        }

        processedPairs++;
        const progress = Math.min(
          10 + Math.floor((processedPairs / clashPairs.length) * 80),
          90,
        );

        // Update progress every 50 pairs
        if (processedPairs % 50 === 0) {
          await this.supabase.rpc('update_bim_federated_job_progress', {
            p_job_id: jobId,
            p_progress: progress,
            p_clashes_found: detectedClashes.length,
          });
        }
      }

      // Insert all detected clashes
      if (detectedClashes.length > 0) {
        const { error: insertError } = await this.supabase
          .from('bim_clashes')
          .insert(detectedClashes);

        if (insertError) {
          throw new Error(`Failed to insert clashes: ${insertError.message}`);
        }
      }

      // Complete the job
      await this.supabase.rpc('complete_bim_federated_job', {
        p_job_id: jobId,
        p_success: true,
      });
    } catch (error) {
      await this.supabase.rpc('complete_bim_federated_job', {
        p_job_id: jobId,
        p_success: false,
        p_error_message:
          error instanceof Error ? error.message : 'Unknown error',
        p_error_details: { error: String(error) },
      });
    }
  }

  private determineClashType(
    disciplineA: string,
    disciplineB: string,
  ): 'hard' | 'soft' | 'clearance' {
    // Hard clashes: Structural elements
    if (
      (disciplineA === 'structure' && disciplineB === 'architecture') ||
      (disciplineA === 'architecture' && disciplineB === 'structure') ||
      (disciplineA === 'structure' && disciplineB === 'structure')
    ) {
      return 'hard';
    }

    // Soft clashes: Services through structure
    if (
      (disciplineA === 'structure' && disciplineB.startsWith('mep_')) ||
      (disciplineA.startsWith('mep_') && disciplineB === 'structure')
    ) {
      return 'soft';
    }

    // Clearance clashes: Services too close
    if (disciplineA.startsWith('mep_') && disciplineB.startsWith('mep_')) {
      return 'clearance';
    }

    return 'hard';
  }

  private meetsSeverityThreshold(severity: string, threshold: string): boolean {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const severityIndex = severityOrder.indexOf(severity);
    const thresholdIndex = severityOrder.indexOf(threshold);
    return severityIndex >= thresholdIndex;
  }

  async getFederatedJobProgress(
    jobId: string,
    companyId: string,
  ): Promise<{
    progress: number;
    status: string;
    clashes_found: number;
    models_processed: number;
    total_models: number;
  }> {
    const job = await this.findOneFederatedJob(jobId, companyId);
    if (!job) throw new Error('Job not found');

    return {
      progress: job.progress,
      status: job.status,
      clashes_found: job.clashes_found,
      models_processed: job.models_processed,
      total_models: job.total_models,
    };
  }

  async findFederatedClashes(
    companyId: string,
    filters: {
      federationJobId?: string;
      disciplineA?: string;
      disciplineB?: string;
      status?: string;
      severity?: string;
    },
  ): Promise<FederatedClash[]> {
    let query = this.supabase
      .from('bim_clashes')
      .select('*')
      .eq('company_id', companyId)
      .not('federation_job_id', 'is', null);

    if (filters.federationJobId) {
      query = query.eq('federation_job_id', filters.federationJobId);
    }
    if (filters.disciplineA) {
      query = query.eq('discipline_a', filters.disciplineA);
    }
    if (filters.disciplineB) {
      query = query.eq('discipline_b', filters.disciplineB);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    const { data, error } = await query.order('detected_at', {
      ascending: false,
    });

    if (error)
      throw new Error(`Failed to fetch federated clashes: ${error.message}`);
    return (data || []) as FederatedClash[];
  }

  async updateFederatedClash(
    id: string,
    companyId: string,
    data: {
      status?: string;
      assigned_to?: string;
      resolution_notes?: string;
    },
  ): Promise<FederatedClash> {
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

    if (error)
      throw new Error(`Failed to update federated clash: ${error.message}`);
    return clash as FederatedClash;
  }

  async addClashComment(
    clashId: string,
    companyId: string,
    commentData: {
      content: string;
      author_email: string;
      author_name?: string;
    },
  ): Promise<{
    id: string;
    content: string;
    author_email: string;
    created_at: string;
  }> {
    const { data: comment, error } = await this.supabase.rpc(
      'add_clash_comment',
      {
        p_clash_id: clashId,
        p_company_id: companyId,
        p_content: commentData.content,
        p_author_email: commentData.author_email,
        p_author_name: commentData.author_name,
      },
    );

    if (error) throw new Error(`Failed to add comment: ${error.message}`);

    // Return the comment data
    const { data: newComment, error: fetchError } = await this.supabase
      .from('bim_clash_comments')
      .select('*')
      .eq('id', comment)
      .single();

    if (fetchError)
      throw new Error(`Failed to fetch comment: ${fetchError.message}`);
    return newComment;
  }

  async getClashComments(
    clashId: string,
    companyId: string,
  ): Promise<
    Array<{
      id: string;
      content: string;
      author_email: string;
      author_name?: string;
      created_at: string;
    }>
  > {
    const { data, error } = await this.supabase
      .from('bim_clash_comments')
      .select('*')
      .eq('clash_id', clashId)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch comments: ${error.message}`);
    return data || [];
  }
}
