/**
 * Ejemplo de implementación EmptyState en BudgetPage
 * 
 * Este archivo muestra cómo usar los EmptyStates en la vista de presupuestos.
 * El componente real debería estar en BudgetEditor.tsx o similar.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState, EmptyStatePresets } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FileSpreadsheet, Plus, Upload, Box } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// EJEMPLO: BudgetPage con Empty States
// ═══════════════════════════════════════════════════════════════════════════

export const BudgetPageExample = () => {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Simular datos - en producción vendrían de React Query
  const budgets: Budget[] | null = null; // o [] para empty state
  const isLoading = false;

  // Handlers
  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleCreate = () => {
    navigate('/budget/new');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: ESTADO DE CARGA
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: SIN PRESUPUESTOS - DROPZONE PARA EXCEL
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (!budgets || budgets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <EmptyState
          {...EmptyStatePresets.noBudgets(
            handleImport,  // onImport: abre el modal de import
            handleCreate   // onCreate: crea desde cero
          )}
        />
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA DE PRESUPUESTOS (cuando existen datos)
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div>
      {/* Lista de presupuestos existente */}
    </div>
  );
};

// ═════════════════════════════��═════════════════════════════════════════════
// EJEMPLO 2: BIMPage con Empty State para modelos 3D
// ═══════════════════════════════════════════════════════════════════════════

export const BIMPageExample = () => {
  const navigate = useNavigate();
  
  // Simular datos
  const models: BIMModel[] | null = null;
  const isLoading = false;

  const handleUpload = () => {
    // Open IFC file selector
  };

  if (isLoading) {
    return <div>Cargando modelos...</div>;
  }

  if (!models || models.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <EmptyState
          {...EmptyStatePresets.noBIM(handleUpload)}
        />
      </motion.div>
    );
  }

  return (
    <div>
      {/* Visor 3D existente */}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// GUÍA DE USO - Dónde implementar en tu código
// ══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * 
 * IMPLEMENTACIÓN EN TU CÓDIGO EXISTENTE:
 * 
 * 1. Importar el componente:
 *    import { EmptyState, EmptyStatePresets } from '../../components/ui/EmptyState';
 *    import { motion, AnimatePresence } from 'framer-motion';
 * 
 * 2. Añadir iconos necesarios:
 *    import { Plus, Upload, FileSpreadsheet, Box, Package } from 'lucide-react';
 * 
 * 3. Reemplazar el estado vacío actual con:
 * 
 *    {(!budgets || budgets.length === 0) ? (
 *      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 *        <EmptyState {...EmptyStatePresets.noBudgets(onImport, onCreate)} />
 *      </motion.div>
 *    ) : (
 *      // Tu lista de presupuestos existente
 *    )}
 * 
 * VENTAJAS DEL NUEVO COMPONENTE:
 * ✓ Animaciones fluidas con Framer Motion
 * ✓ Sistema de dropzone integrado
 * ✓ Consistentes con el sistema de diseño
 * ✓ Bordes punteados sutiles en slate-800
 * ✓ Botones con gradientes emerald para CTAs principales
 * ✓ 完全 reutilizable en cualquier vista
 * 
 */