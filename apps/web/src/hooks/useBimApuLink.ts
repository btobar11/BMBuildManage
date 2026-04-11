import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export interface BimApuLink {
  id: string;
  project_id: string;
  item_id: string;
  ifc_global_id: string;
  ifc_type?: string;
  element_name?: string;
  quantity_type: 'volume' | 'area' | 'length' | 'count';
  quantity_multiplier: number;
  auto_sync_enabled: boolean;
  last_synced_at?: string;
  status: 'active' | 'archived' | 'superseded';
}

export interface LinkElementPayload {
  project_id: string;
  item_id: string;
  ifc_global_id: string;
  ifc_type?: string;
  element_name?: string;
  quantity_type?: 'volume' | 'area' | 'length' | 'count';
  quantity_multiplier?: number;
  auto_sync_enabled?: boolean;
}

export interface SyncResult {
  item_id: string;
  ifc_global_id: string;
  old_quantity: number;
  new_quantity: number;
  old_total_cost: number;
  new_total_cost: number;
  synced_at: string;
}

export interface SyncStatus {
  total_links: number;
  auto_sync_enabled: number;
  last_sync: string | null;
  items_affected: number;
}

function getHeaders() {
  return {};
}

export function useBimApuLinks(projectId: string) {
  return useQuery({
    queryKey: ['bim-apu-links', projectId],
    queryFn: async () => {
      const response = await api.get<BimApuLink[]>(`/bim-apu-link/project/${projectId}`, {
        headers: getHeaders(),
      });
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useBimApuLinksByItem(itemId: string) {
  return useQuery({
    queryKey: ['bim-apu-links-by-item', itemId],
    queryFn: async () => {
      const response = await api.get<BimApuLink[]>(`/bim-apu-link/item/${itemId}`, {
        headers: getHeaders(),
      });
      return response.data;
    },
    enabled: !!itemId,
  });
}

export function useLinkBimElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LinkElementPayload) => {
      const response = await api.post<{ success: boolean; data: BimApuLink }>(
        '/bim-apu-link',
        payload,
        { headers: getHeaders() }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bim-apu-links'] });
      queryClient.invalidateQueries({ queryKey: ['bim-apu-links-by-item', variables.item_id] });
      queryClient.invalidateQueries({ queryKey: ['budget', variables.project_id] });
    },
  });
}

export function useUnlinkBimElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const response = await api.delete(`/bim-apu-link/${linkId}`, {
        headers: getHeaders(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-apu-links'] });
    },
  });
}

export function useSyncBimQuantities(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean; data: SyncResult[] }>(
        `/bim-apu-link/sync/${projectId}`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-apu-links', projectId] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
    },
  });
}

export function useBimSyncStatus(projectId: string) {
  return useQuery({
    queryKey: ['bim-sync-status', projectId],
    queryFn: async () => {
      const response = await api.get<SyncStatus>(`/bim-apu-link/status/${projectId}`, {
        headers: getHeaders(),
      });
      return response.data;
    },
    enabled: !!projectId,
  });
}