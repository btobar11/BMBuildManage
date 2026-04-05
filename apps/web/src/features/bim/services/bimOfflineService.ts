/**
 * BIM Element State Offline Sync Service
 * 
 * Handles offline-first synchronization for BIM element states using IndexedDB.
 * Ensures data consistency with version-based conflict resolution.
 */
import { supabase } from '../../../lib/supabase';
import type { 
  BimElementState, 
  ElementStatus, 
  StateUpdatePayload, 
  IndexedDBElementState,
  SyncResult,
} from '../types-bim5d';

// ─── IndexedDB Setup ──────────────────────────────────────────────────────────

const DB_NAME = 'bm-bim-offline';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Element states store
      if (!db.objectStoreNames.contains('element_states')) {
        const store = db.createObjectStore('element_states', { keyPath: 'element_id' });
        store.createIndex('by_sync_status', 'pending_sync', { unique: false });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_created', 'created_at', { unique: false });
      }

      // Elements cache store
      if (!db.objectStoreNames.contains('elements_cache')) {
        db.createObjectStore('elements_cache', { keyPath: 'id' });
      }
    };
  });
}

// ─── Element State Operations ─────────────────────────────────────────────────

export async function getLocalElementState(elementId: string): Promise<IndexedDBElementState | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('element_states', 'readonly');
    const store = transaction.objectStore('element_states');
    const request = store.get(elementId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function saveLocalElementState(state: IndexedDBElementState): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('element_states', 'readwrite');
    const store = transaction.objectStore('element_states');
    const request = store.put(state);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllLocalElementStates(): Promise<IndexedDBElementState[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('element_states', 'readonly');
    const store = transaction.objectStore('element_states');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function getPendingSyncStates(): Promise<IndexedDBElementState[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('element_states', 'readonly');
    const store = transaction.objectStore('element_states');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = (request.result as IndexedDBElementState[]).filter(s => s.pending_sync);
      resolve(results);
    };
  });
}

export async function deleteLocalElementState(elementId: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('element_states', 'readwrite');
    const store = transaction.objectStore('element_states');
    const request = store.delete(elementId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllLocalStates(): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('element_states', 'readwrite');
    const store = transaction.objectStore('element_states');
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ─── Sync Queue Operations ────────────────────────────────────────────────────

interface SyncQueueItem {
  id?: number;
  type: 'state_update';
  payload: StateUpdatePayload;
  created_at: string;
  retry_count: number;
  last_error: string | null;
}

export async function addToSyncQueue(payload: StateUpdatePayload): Promise<number> {
  const db = await openDatabase();
  
  const item: SyncQueueItem = {
    type: 'state_update',
    payload,
    created_at: new Date().toISOString(),
    retry_count: 0,
    last_error: null,
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const request = store.add(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as number);
  });
}

export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync_queue', 'readonly');
    const store = transaction.objectStore('sync_queue');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function updateSyncQueueItem(id: number, updates: Partial<SyncQueueItem>): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        const updated = { ...item, ...updates };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ─── Core State Management ─────────────────────────────────────────────────────

export interface StateUpdateResult {
  success: boolean;
  localState?: IndexedDBElementState;
  serverState?: BimElementState;
  conflict?: boolean;
  error?: string;
}

export async function updateElementState(
  elementId: string,
  status: ElementStatus,
  progress: number,
  options?: {
    notes?: string;
    assignedTo?: string;
  }
): Promise<StateUpdateResult> {
  const isOnline = navigator.onLine;
  
  // Get existing local state or create new
  let localState = await getLocalElementState(elementId);
  
  if (!localState) {
    localState = {
      id: crypto.randomUUID(),
      element_id: elementId,
      status,
      progress_percent: progress,
      assigned_to: options?.assignedTo || null,
      notes: options?.notes || null,
      local_version: 1,
      server_version: 0,
      last_synced_at: null,
      pending_sync: true,
    };
  } else {
    localState.status = status;
    localState.progress_percent = progress;
    localState.notes = options?.notes || localState.notes;
    localState.assigned_to = options?.assignedTo || localState.assigned_to;
    localState.local_version += 1;
    localState.pending_sync = true;
  }

  // Save to local storage
  await saveLocalElementState(localState);

  // Add to sync queue
  const payload: StateUpdatePayload = {
    element_id: elementId,
    status,
    progress_percent: progress,
    notes: options?.notes,
    local_version: localState.local_version,
  };
  await addToSyncQueue(payload);

  // If online, attempt immediate sync
  if (isOnline) {
    try {
      const syncResult = await syncElementState(elementId);
      if (syncResult && !syncResult.conflict) {
        // Update local with server version
        localState.server_version = syncResult.serverState?.server_version || localState.server_version + 1;
        localState.last_synced_at = new Date().toISOString();
        localState.pending_sync = false;
        await saveLocalElementState(localState);
        
        return {
          success: true,
          localState,
          serverState: syncResult.serverState,
        };
      }
    } catch (error) {
      console.warn('[BimOffline] Immediate sync failed, queued for later:', error);
    }
  }

  return {
    success: true,
    localState,
  };
}

export async function syncElementState(
  elementId: string
): Promise<{ serverState?: BimElementState; conflict?: boolean }> {
  const localState = await getLocalElementState(elementId);
  if (!localState) {
    return {};
  }

  // Get server state first
  const { data: serverState, error } = await supabase
    .from('bim_element_states')
    .select('*')
    .eq('element_id', elementId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Check version conflict
  if (serverState) {
    if (localState.server_version >= serverState.server_version) {
      // Local is ahead or same, push update
      const { data: updated, error: updateError } = await supabase
        .from('bim_element_states')
        .update({
          status: localState.status,
          progress_percent: localState.progress_percent,
          notes: localState.notes,
          server_version: localState.server_version + 1,
          last_synced_at: new Date().toISOString(),
        })
        .eq('element_id', elementId)
        .select()
        .single();

      if (updateError) throw updateError;
      return { serverState: updated };
    } else {
      // Server has newer version, conflict
      return { serverState, conflict: true };
    }
  } else {
    // No server state, create new
    const { data: created, error: createError } = await supabase
      .from('bim_element_states')
      .insert({
        element_id: elementId,
        status: localState.status,
        progress_percent: localState.progress_percent,
        notes: localState.notes,
        assigned_to: localState.assigned_to,
        server_version: 1,
        local_version: localState.local_version,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;
    return { serverState: created };
  }
}

// ─── Batch Sync ────────────────────────────────────────────────────────────────

export async function syncAllPendingStates(): Promise<SyncResult> {
  const pendingStates = await getPendingSyncStates();
  const queueItems = await getSyncQueueItems();
  
  const result: SyncResult = {
    success: true,
    synced_count: 0,
    failed_count: 0,
    errors: [],
  };

  if (pendingStates.length === 0) {
    return result;
  }

  // Process each pending state
  for (const state of pendingStates) {
    try {
      const syncResult = await syncElementState(state.element_id);
      
      if (syncResult && !syncResult.conflict) {
        // Update local state
        state.pending_sync = false;
        state.last_synced_at = new Date().toISOString();
        state.server_version = syncResult.serverState?.server_version || state.server_version + 1;
        await saveLocalElementState(state);
        
        // Remove from queue
        const queueItem = queueItems.find(q => q.payload.element_id === state.element_id);
        if (queueItem && queueItem.id !== undefined) {
          await removeSyncQueueItem(queueItem.id);
        }
        
        result.synced_count++;
      } else {
        result.failed_count++;
        result.errors.push(`Conflict for element ${state.element_id}`);
      }
    } catch (error) {
      result.failed_count++;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.success = false;
    }
  }

  return result;
}

// ─── Fetch from Server ────────────────────────────────────────────────────────

export async function fetchServerElementState(elementId: string): Promise<BimElementState | null> {
  const { data, error } = await supabase
    .from('bim_element_states')
    .select('*')
    .eq('element_id', elementId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function fetchElementStatesByModel(modelId: string): Promise<BimElementState[]> {
  // First get all element IDs for this model
  const { data: elements, error: elementsError } = await supabase
    .from('bim_elements')
    .select('id')
    .eq('model_id', modelId);

  if (elementsError) throw elementsError;
  if (!elements || elements.length === 0) return [];

  const elementIds = elements.map(e => e.id);

  // Then get states for those elements
  const { data: states, error: statesError } = await supabase
    .from('bim_element_states')
    .select('*')
    .in('element_id', elementIds);

  if (statesError) throw statesError;
  return states || [];
}

// ─── Conflict Resolution ──────────────────────────────────────────────────────

export interface ConflictResolution {
  resolution: 'keep_local' | 'keep_server' | 'merge';
  localState?: IndexedDBElementState;
  serverState?: BimElementState;
}

export async function resolveConflict(
  elementId: string,
  resolution: 'keep_local' | 'keep_server' | 'merge'
): Promise<void> {
  const localState = await getLocalElementState(elementId);
  const serverState = await fetchServerElementState(elementId);

  if (!localState) return;

  if (resolution === 'keep_server' && serverState) {
    // Overwrite local with server
    localState.status = serverState.status as ElementStatus;
    localState.progress_percent = serverState.progress_percent;
    localState.notes = serverState.notes;
    localState.server_version = serverState.server_version;
    localState.pending_sync = false;
    await saveLocalElementState(localState);
  } else if (resolution === 'keep_local') {
    // Force push local to server
    await updateElementState(
      localState.element_id,
      localState.status,
      localState.progress_percent,
      { notes: localState.notes || undefined }
    );
  } else if (resolution === 'merge' && serverState) {
    // Merge: take latest progress
    const mergedStatus = localState.progress_percent >= (serverState.progress_percent || 0)
      ? localState.status
      : (serverState.status as ElementStatus);
    const mergedProgress = Math.max(localState.progress_percent, serverState.progress_percent || 0);
    
    await updateElementState(elementId, mergedStatus, mergedProgress, {
      notes: localState.notes || serverState.notes || undefined,
    });
  }
}
