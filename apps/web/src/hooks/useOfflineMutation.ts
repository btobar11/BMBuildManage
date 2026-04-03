/**
 * Hook para manejar mutaciones offline
 * Permite crear/actualizar datos cuando no hay conexión
 * y sincronizar cuando vuelve la conexión
 */

import { useState, useEffect, useCallback } from 'react';

export interface PendingMutation {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'bm-pending-mutations';

/**
 * Hook para gestionar mutaciones pendientes de sincronización
 */
export function useOfflineMutations() {
  const [pendingMutations, setPendingMutations] = useState<PendingMutation[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Cargar mutaciones pendientes del localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPendingMutations(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistir mutaciones cuando cambian
  useEffect(() => {
    if (pendingMutations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingMutations));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingMutations]);

  /**
   * Añadir una mutación a la cola pendiente
   */
  const queueMutation = useCallback((mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retries'>) => {
    const newMutation: PendingMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    setPendingMutations(prev => [...prev, newMutation]);

    // Notificar al Service Worker si está disponible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'MUTATION_QUEUED',
        data: newMutation,
      });
    }

    return newMutation;
  }, []);

  /**
   * Eliminar una mutación de la cola
   */
  const removeMutation = useCallback((id: string) => {
    setPendingMutations(prev => prev.filter(m => m.id !== id));
  }, []);

  /**
   * Limpiar todas las mutaciones pendientes
   */
  const clearAllMutations = useCallback(() => {
    setPendingMutations([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Reintentar una mutación específica
   */
  const retryMutation = useCallback(async (id: string) => {
    const mutation = pendingMutations.find(m => m.id === id);
    if (!mutation) return;

    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        body: mutation.body,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        removeMutation(id);
      }
    } catch {
      // Aumentar contador de reintentos
      setPendingMutations(prev =>
        prev.map(m =>
          m.id === id ? { ...m, retries: m.retries + 1 } : m
        )
      );
    }
  }, [pendingMutations, removeMutation]);

  /**
   * Sincronizar todas las mutaciones pendientes
   */
  const syncAll = useCallback(async () => {
    if (!isOnline) {
      console.warn('[Offline] Cannot sync while offline');
      return;
    }

    const results = await Promise.allSettled(
      pendingMutations.map(async mutation => {
        try {
          const response = await fetch(mutation.url, {
            method: mutation.method,
            body: mutation.body,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            return { id: mutation.id, success: true };
          }
          return { id: mutation.id, success: false };
        } catch {
          return { id: mutation.id, success: false };
        }
      })
    );

    // Eliminar las que fueron exitosas
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        removeMutation(result.value.id);
      }
    });
  }, [isOnline, pendingMutations, removeMutation]);

  return {
    pendingMutations,
    pendingCount: pendingMutations.length,
    isOnline,
    queueMutation,
    removeMutation,
    clearAllMutations,
    retryMutation,
    syncAll,
    hasPending: pendingMutations.length > 0,
  };
}

/**
 * Hook para obtener el estado de conexión
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Resetear flag si estuvimos offline
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  };
}

export default useOfflineMutations;