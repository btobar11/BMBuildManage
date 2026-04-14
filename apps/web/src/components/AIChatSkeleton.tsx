'use client';

import React from 'react';
import { Skeleton } from './ui/Skeleton';

/**
 * AIChatSkeleton - Skeleton para el chat de IA
 * Úselo durante estados de carga (isLoading de React Query)
 */
export const AIChatSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Mensaje del asistente (esqueleto) */}
      <div className="flex justify-start">
        <div className="max-w-[85%]">
          <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-sm">
            <div className="space-y-2">
              <Skeleton variant="text" width="90%" height="0.875rem" />
              <Skeleton variant="text" width="75%" height="0.875rem" />
              <Skeleton variant="text" width="60%" height="0.875rem" />
            </div>
          </div>
        </div>
      </div>

      {/* Sugerencias (esqueleto) */}
      <div className="flex justify-start">
        <div className="flex gap-2 mt-2">
          <Skeleton variant="rounded" width="5rem" height="1.5rem" />
          <Skeleton variant="rounded" width="4rem" height="1.5rem" />
          <Skeleton variant="rounded" width="6rem" height="1.5rem" />
        </div>
      </div>
    </div>
  );
};

/**
 * AIResponseSkeleton - Skeleton para respuestas de análisis
 * Úselo para análisis de presupuesto, predicciones, etc.
 */
export const AIResponseSkeleton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'full' }) => {
  if (variant === 'compact') {
    return (
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
          <Skeleton variant="text" width="40%" height="0.875rem" />
        </div>
        <Skeleton variant="text" width="100%" height="0.75rem" className="mb-1" />
        <Skeleton variant="text" width="80%" height="0.75rem" className="mb-1" />
        <Skeleton variant="text" width="60%" height="0.75rem" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
        <div className="flex-1">
          <Skeleton variant="text" width="50%" height="1rem" className="mb-1" />
          <Skeleton variant="text" width="30%" height="0.75rem" />
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-3 mb-4">
        <Skeleton variant="text" width="95%" height="0.875rem" />
        <Skeleton variant="text" width="85%" height="0.875rem" />
        <Skeleton variant="text" width="90%" height="0.875rem" />
        <Skeleton variant="text" width="70%" height="0.875rem" />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width="50%" height="0.75rem" className="mb-1" />
            <Skeleton variant="text" width="70%" height="1.25rem" />
          </div>
        ))}
      </div>

      {/* Recomendaciones */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <Skeleton variant="text" width="40%" height="0.875rem" className="mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton variant="rounded" width="5rem" height="1.5rem" />
          <Skeleton variant="rounded" width="4rem" height="1.5rem" />
          <Skeleton variant="rounded" width="6rem" height="1.5rem" />
        </div>
      </div>
    </div>
  );
};

/**
 * AISummarySkeleton - Skeleton para tarjetas de resumen
 * Úselo para dashboards que muestran insights de IA
 */
export const AISummarySkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
          <Skeleton variant="circular" width="2rem" height="2rem" />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" height="0.875rem" className="mb-1" />
            <Skeleton variant="text" width="80%" height="0.75rem" />
          </div>
          <Skeleton variant="rounded" width="4rem" height="1.5rem" />
        </div>
      ))}
    </div>
  );
};