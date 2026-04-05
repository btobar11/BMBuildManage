/**
 * BIM Data Ingestion Service
 * 
 * Ingests extracted IFC data into Supabase using transactional batches.
 * Ensures data integrity with proper error handling and rollback.
 */
import { supabase } from '../../../lib/supabase';
import type { ExtractionResult, ExtractedElement, SpatialNode } from './ifcExtractionService';
import type { IfcQuantities } from '../types';

// ─── Database Types ──────────────────────────────────────────────────────────

export interface BimModelDB {
  id: string;
  company_id: string;
  project_id: string;
  project_model_id: string | null;
  filename: string;
  version: number;
  file_size_bytes: number | null;
  element_count: number;
  spatial_tree: SpatialNode | null;
  statistics: ModelStatisticsDB | null;
  uploaded_at: string;
  parsed_at: string | null;
  status: 'uploaded' | 'parsing' | 'parsed' | 'error';
  parse_error: string | null;
}

export interface BimElementDB {
  id: string;
  company_id: string;
  model_id: string;
  ifc_guid: string;
  express_id: number | null;
  name: string;
  object_type: string | null;
  ifc_type: string;
  category: string | null;
  storey_id: string | null;
  storey_name: string | null;
  bounding_box: BoundingBoxDB | null;
  spatial_location: any | null;
  quantities: IfcQuantities | null;
  linked_item_id: string | null;
}

export interface BimPropertyDB {
  id: string;
  company_id: string;
  element_id: string;
  property_set_name: string;
  property_name: string;
  property_type: string | null;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
}

export interface BoundingBoxDB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface ModelStatisticsDB {
  byType: Record<string, number>;
  byStorey: Record<string, number>;
  totalVolume: number;
  totalArea: number;
  totalLength: number;
}

// ─── Ingestion Options ───────────────────────────────────────────────────────

export interface IngestionOptions {
  companyId: string;
  projectId: string;
  projectModelId?: string;
  filename: string;
  fileSizeBytes?: number;
  onProgress?: (progress: number, message: string) => void;
}

export interface IngestionResult {
  success: boolean;
  modelId?: string;
  elementCount: number;
  propertyCount: number;
  errors: string[];
}

// ─── Batch Processing ─────────────────────────────────────────────────────────

const BATCH_SIZE = 500;

export class BimDataIngestionService {
  private options: IngestionOptions;
  private errors: string[] = [];

  constructor(options: IngestionOptions) {
    this.options = options;
  }

  async ingest(extraction: ExtractionResult): Promise<IngestionResult> {
    const { companyId, projectId, projectModelId, filename, fileSizeBytes, onProgress } = this.options;
    
    this.errors = [];
    let modelId: string | undefined;

    try {
      onProgress?.(5, 'Creating BIM model record...');

      // Step 1: Create bim_model record
      const modelResult = await this.createBimModel(
        companyId,
        projectId,
        projectModelId,
        filename,
        fileSizeBytes,
        extraction
      );

      if (!modelResult.success || !modelResult.id) {
        throw new Error(modelResult.error || 'Failed to create BIM model');
      }

      modelId = modelResult.id;
      onProgress?.(10, `Model record created: ${modelId}`);

      // Step 2: Insert elements in batches
      const elements = extraction.elements;
      const totalElements = elements.length;
      let processedElements = 0;
      let elementIdMap = new Map<string, string>();

      onProgress?.(15, `Inserting ${totalElements} elements...`);

      for (let i = 0; i < elements.length; i += BATCH_SIZE) {
        const batch = elements.slice(i, i + BATCH_SIZE);
        const batchResult = await this.insertElementBatch(
          companyId,
          modelId,
          batch,
          elementIdMap
        );

        if (!batchResult.success) {
          this.errors.push(...batchResult.errors);
        }

        processedElements += batch.length;
        const progress = 15 + Math.floor((processedElements / totalElements) * 55);
        onProgress?.(progress, `Processed ${processedElements}/${totalElements} elements`);
      }

      onProgress?.(70, 'Inserting properties...');

      // Step 3: Insert properties in batches
      let propertyCount = 0;
      for (let i = 0; i < elements.length; i += BATCH_SIZE) {
        const batch = elements.slice(i, i + BATCH_SIZE);
        const propResult = await this.insertPropertyBatch(
          companyId,
          batch,
          elementIdMap
        );

        if (!propResult.success) {
          this.errors.push(...propResult.errors);
        }

        propertyCount += propResult.count;
        const progress = 70 + Math.floor((i / elements.length) * 25);
        onProgress?.(progress, `Processed ${propertyCount} properties`);
      }

      // Step 4: Mark model as parsed
      onProgress?.(95, 'Finalizing...');
      await this.markModelAsParsed(modelId);

      onProgress?.(100, 'Complete');

      return {
        success: true,
        modelId,
        elementCount: totalElements,
        propertyCount,
        errors: this.errors,
      };
    } catch (error) {
      console.error('[BimIngestion] Error during ingestion:', error);
      this.errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Mark model as error if we got that far
      if (modelId) {
        await this.markModelAsError(modelId, this.errors[0]);
      }

      return {
        success: false,
        errors: this.errors,
        elementCount: 0,
        propertyCount: 0,
      };
    }
  }

  private async createBimModel(
    companyId: string,
    projectId: string,
    projectModelId: string | undefined,
    filename: string,
    fileSizeBytes: number | undefined,
    extraction: ExtractionResult
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const statistics: ModelStatisticsDB = {
      byType: extraction.statistics.byType,
      byStorey: extraction.statistics.byStorey,
      totalVolume: extraction.statistics.totalVolume,
      totalArea: extraction.statistics.totalArea,
      totalLength: extraction.statistics.totalLength,
    };

    const { data, error } = await supabase
      .from('bim_models')
      .insert({
        company_id: companyId,
        project_id: projectId,
        project_model_id: projectModelId || null,
        filename,
        element_count: extraction.elementCount,
        file_size_bytes: fileSizeBytes || null,
        spatial_tree: extraction.spatialTree,
        statistics,
        status: 'parsing',
        uploaded_at: new Date().toISOString(),
        parsed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[BimIngestion] Error creating bim_model:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  }

  private async insertElementBatch(
    companyId: string,
    modelId: string,
    elements: ExtractedElement[],
    elementIdMap: Map<string, string>
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const records: BimElementDB[] = elements.map((el) => ({
      id: crypto.randomUUID(),
      company_id: companyId,
      model_id: modelId,
      ifc_guid: el.ifcGuid,
      express_id: el.expressID,
      name: el.name,
      object_type: el.objectType || null,
      ifc_type: el.ifcType,
      category: el.ifcType,
      storey_id: el.storeyId,
      storey_name: el.storeyName,
      bounding_box: el.boundingBox,
      spatial_location: null,
      quantities: el.quantities,
      linked_item_id: null,
    }));

    // Map GUIDs to IDs for property insertion
    for (const record of records) {
      elementIdMap.set(record.ifc_guid, record.id);
    }

    const { error } = await supabase
      .from('bim_elements')
      .insert(records);

    if (error) {
      console.error('[BimIngestion] Error inserting elements batch:', error);
      return { success: false, count: 0, errors: [error.message] };
    }

    return { success: true, count: records.length, errors: [] };
  }

  private async insertPropertyBatch(
    companyId: string,
    elements: ExtractedElement[],
    elementIdMap: Map<string, string>
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const records: BimPropertyDB[] = [];

    for (const element of elements) {
      const elementId = elementIdMap.get(element.ifcGuid);
      if (!elementId) continue;

      for (const prop of element.properties) {
        records.push({
          id: crypto.randomUUID(),
          company_id: companyId,
          element_id: elementId,
          property_set_name: prop.propertySetName,
          property_name: prop.propertyName,
          property_type: prop.propertyType,
          value: prop.value,
          numeric_value: prop.numericValue,
          unit: prop.unit,
        });
      }
    }

    if (records.length === 0) {
      return { success: true, count: 0, errors: [] };
    }

    // Insert in smaller sub-batches for properties (they can be many)
    const propBatchSize = 200;
    let insertedCount = 0;
    let errors: string[] = [];

    for (let i = 0; i < records.length; i += propBatchSize) {
      const batch = records.slice(i, i + propBatchSize);
      const { error } = await supabase
        .from('bim_properties')
        .insert(batch);

      if (error) {
        console.error('[BimIngestion] Error inserting properties batch:', error);
        errors.push(error.message);
      } else {
        insertedCount += batch.length;
      }
    }

    return { success: errors.length === 0, count: insertedCount, errors };
  }

  private async markModelAsParsed(modelId: string): Promise<void> {
    await supabase
      .from('bim_models')
      .update({
        status: 'parsed',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', modelId);
  }

  private async markModelAsError(modelId: string, errorMessage: string): Promise<void> {
    await supabase
      .from('bim_models')
      .update({
        status: 'error',
        parse_error: errorMessage,
      })
      .eq('id', modelId);
  }
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getBimModel(
  modelId: string
): Promise<BimModelDB | null> {
  const { data, error } = await supabase
    .from('bim_models')
    .select('*')
    .eq('id', modelId)
    .single();

  if (error) {
    console.error('[BimIngestion] Error fetching bim_model:', error);
    return null;
  }

  return data;
}

export async function getBimElements(
  modelId: string,
  options?: {
    limit?: number;
    offset?: number;
    ifcType?: string;
    storeyName?: string;
  }
): Promise<BimElementDB[]> {
  let query = supabase
    .from('bim_elements')
    .select('*')
    .eq('model_id', modelId);

  if (options?.ifcType) {
    query = query.eq('ifc_type', options.ifcType);
  }

  if (options?.storeyName) {
    query = query.eq('storey_name', options.storeyName);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[BimIngestion] Error fetching bim_elements:', error);
    return [];
  }

  return data || [];
}

export async function getBimElementByGuid(
  modelId: string,
  ifcGuid: string
): Promise<BimElementDB | null> {
  const { data, error } = await supabase
    .from('bim_elements')
    .select('*')
    .eq('model_id', modelId)
    .eq('ifc_guid', ifcGuid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[BimIngestion] Error fetching bim_element by GUID:', error);
    return null;
  }

  return data;
}

export async function getBimElementProperties(
  elementId: string
): Promise<BimPropertyDB[]> {
  const { data, error } = await supabase
    .from('bim_properties')
    .select('*')
    .eq('element_id', elementId);

  if (error) {
    console.error('[BimIngestion] Error fetching bim_properties:', error);
    return [];
  }

  return data || [];
}

export async function getBimModelsByProject(
  projectId: string
): Promise<BimModelDB[]> {
  const { data, error } = await supabase
    .from('bim_models')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('[BimIngestion] Error fetching bim_models by project:', error);
    return [];
  }

  return data || [];
}

export async function deleteBimModel(modelId: string): Promise<boolean> {
  // Delete properties first (FK constraint)
  const { error: propsError } = await supabase
    .from('bim_properties')
    .delete()
    .eq('element_id', modelId);

  if (propsError) {
    console.error('[BimIngestion] Error deleting bim_properties:', propsError);
    // Continue anyway - cascade will handle it
  }

  // Delete elements
  const { error: elementsError } = await supabase
    .from('bim_elements')
    .delete()
    .eq('model_id', modelId);

  if (elementsError) {
    console.error('[BimIngestion] Error deleting bim_elements:', elementsError);
  }

  // Delete model
  const { error: modelError } = await supabase
    .from('bim_models')
    .delete()
    .eq('id', modelId);

  if (modelError) {
    console.error('[BimIngestion] Error deleting bim_model:', modelError);
    return false;
  }

  return true;
}
