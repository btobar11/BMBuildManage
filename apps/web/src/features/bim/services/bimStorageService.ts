/**
 * Supabase Storage Service for BIM Models
 * Handles upload, download, and management of IFC files
 */
import { supabase } from '../../../lib/supabase';
import type { ProjectModel } from '../types';

const BUCKET_NAME = 'bim-models';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload an IFC model file to Supabase Storage and register it in project_models
 */
export async function uploadModel(
  file: File,
  projectId: string,
  companyId: string,
  modelName?: string
): Promise<ProjectModel> {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el límite de 50MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  if (!file.name.toLowerCase().endsWith('.ifc')) {
    throw new Error('Solo se permiten archivos .ifc');
  }

  const fileName = file.name;
  const storagePath = `${companyId}/${projectId}/${fileName}`;
  const displayName = modelName || fileName.replace('.ifc', '');

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/octet-stream',
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  // Register in project_models table (upserting if a file with the same path already exists)
  const { data, error: dbError } = await supabase
    .from('project_models')
    .upsert({
      project_id: projectId,
      company_id: companyId,
      name: displayName,
      file_name: fileName,
      storage_path: storagePath,
      file_size: file.size,
      status: 'uploaded',
    }, {
      onConflict: 'project_id, storage_path'
    })
    .select()
    .single();

  if (dbError) {
    // Try to clean up the uploaded file
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    console.error('DB insert error:', dbError);
    throw new Error(`Error al registrar el modelo: ${dbError.message}`);
  }

  return data as ProjectModel;
}

/**
 * Get all BIM models for a project
 */
export async function getProjectModels(projectId: string): Promise<ProjectModel[]> {
  const { data, error } = await supabase
    .from('project_models')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project models:', error);
    throw new Error(`Error al obtener modelos: ${error.message}`);
  }

  return (data || []) as ProjectModel[];
}

/**
 * Get a signed download URL for a model file (1 hour expiry)
 */
export async function getModelDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error) {
    console.error('Error creating signed URL:', error);
    throw new Error(`Error al generar URL del modelo: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Download the IFC file as an ArrayBuffer
 */
export async function downloadModelBuffer(storagePath: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error) {
    console.error('Error downloading model:', error);
    throw new Error(`Error al descargar el modelo: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Delete a BIM model (from both storage and database)
 */
export async function deleteModel(modelId: string, storagePath: string): Promise<void> {
  console.log(`[bimStorageService] deleteModel called for ID: ${modelId}, Path: ${storagePath}`);
  
  // 1. Delete from Storage (wrapped in try-catch to handle missing files gracefully)
  try {
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (storageError) {
      console.warn('[bimStorageService] Storage removal warning (may already be deleted):', storageError);
    } else {
      console.log('[bimStorageService] Storage removal response:', storageData);
    }
  } catch (err) {
    console.error('[bimStorageService] Unexpected storage removal error:', err);
    // Continue to database deletion anyway
  }

  // 2. Delete from Database
  console.log('[bimStorageService] Attempting database record removal...');
  const { error: dbError } = await supabase
    .from('project_models')
    .delete()
    .eq('id', modelId);

  if (dbError) {
    console.error('[bimStorageService] Database deletion error:', dbError);
    throw new Error(`Error al eliminar el registro de la base de datos: ${dbError.message}`);
  }

  console.log('[bimStorageService] Deletion completed successfully');
}
