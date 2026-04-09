/**
 * BIM Storage Service for BIM Models
 * Handles upload, download, and management of IFC files via API
 */
import { supabase } from '../../../lib/supabase';
import api from '../../../lib/api';
import type { ProjectModel } from '../types';

const BUCKET_NAME = 'bim-models';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload an IFC model file via API endpoint (recommended approach)
 */
export async function uploadModel(
  file: File,
  projectId: string,
  _companyId: string,
  modelName?: string
): Promise<ProjectModel> {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el límite de 50MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  if (!file.name.toLowerCase().endsWith('.ifc') && !file.name.toLowerCase().endsWith('.ifcxml')) {
    throw new Error('Solo se permiten archivos .ifc o .ifcxml');
  }

  // Use API endpoint instead of direct Supabase insertion
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  if (modelName) {
    formData.append('modelName', modelName);
  }

  try {
    const response = await api.post('/bim/models', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.model as ProjectModel;
  } catch (error: any) {
    console.error('API upload error:', error);
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Error de validación en la subida del archivo');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor. Por favor intenta nuevamente.');
    }
    
    throw new Error(`Error al subir el archivo: ${error.message}`);
  }
}

/**
 * Get all BIM models for a project (via API endpoint)
 */
export async function getProjectModels(projectId: string): Promise<ProjectModel[]> {
  try {
    const response = await api.get(`/bim/models?projectId=${projectId}`);
    return response.data as ProjectModel[];
  } catch (error: any) {
    console.error('Error fetching project models:', error);
    
    if (error.response?.status === 404) {
      return []; // No models found, return empty array
    }
    
    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor al obtener los modelos');
    }
    
    throw new Error(`Error al obtener modelos: ${error.message}`);
  }
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
 * Delete a BIM model (via API endpoint)
 */
export async function deleteModel(modelId: string, storagePath: string): Promise<void> {
  console.log(`[bimStorageService] deleteModel called for ID: ${modelId}, Path: ${storagePath}`);
  
  try {
    await api.delete(`/bim/models/${modelId}`);
    console.log('[bimStorageService] Deletion completed successfully via API');
  } catch (error: any) {
    console.error('[bimStorageService] API deletion error:', error);
    
    if (error.response?.status === 404) {
      throw new Error('El modelo no fue encontrado');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor al eliminar el modelo');
    }
    
    throw new Error(`Error al eliminar el modelo: ${error.message}`);
  }
}
