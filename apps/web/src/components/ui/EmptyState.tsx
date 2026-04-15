/**
 * EmptyState - Premium Empty State Component
 * 
 * Sistema de estados vacíos reutilizable para BM Build Manage
 * 
 * Características:
 * - Animaciones Fluidas con Framer Motion
 * - Soporte para Dropzones (arrastrar archivos)
 * - Sistema de diseño Slate & Emerald
 * - Bordes punteados sutiles
 * - Botones con gradientes emerald
 */

import React, { useCallback, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useDropzone, type Accept } from 'react-dropzone';
import type { LucideIcon } from 'lucide-react';
import { Upload, FolderOpen, Plus, Package, FileSpreadsheet, Box } from 'lucide-react';
import { Button } from './Button/Button';
import { cn } from '../../utils/cn';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════════

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Variante del componente */
  variant?: 'default' | 'dropzone' | 'illustrated';
  /** Icono principal (lucide-react) */
  icon?: LucideIcon;
  /** Título principal */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Acción primaria (botón principal con gradiente emerald) */
  primaryAction?: EmptyStateAction;
  /** Acción secundaria (botón outline) */
  secondaryAction?: EmptyStateAction;
  /** Tamaño del componente */
  size?: 'sm' | 'md' | 'lg';
  /** Props para dropzone */
  dropzoneProps?: {
    accept?: Accept;
    multiple?: boolean;
    onFilesDropped?: (files: File[]) => void;
  };
  /** Custom className */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ANIMACIONES - Framer Motion
// ═══════════════════════════════════════════════════════════════════════════

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // ease-out-cubic
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

const iconBounce: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: 0.1,
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE TAMAÑOS
// ═══════════════════════════════════════════════════════════════════════════

const sizeConfig = {
  sm: {
    iconSize: 40,
    iconBox: 'w-12 h-12',
    title: 'text-lg',
    desc: 'text-sm',
    py: 'py-8',
    px: 'px-6',
  },
  md: {
    iconSize: 48,
    iconBox: 'w-16 h-16',
    title: 'text-xl',
    desc: 'text-base',
    py: 'py-12',
    px: 'px-8',
  },
  lg: {
    iconSize: 56,
    iconBox: 'w-20 h-20',
    title: 'text-2xl',
    desc: 'text-lg',
    py: 'py-16',
    px: 'px-10',
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon: Icon = FolderOpen,
  title,
  description,
  primaryAction,
  secondaryAction,
  size = 'md',
  dropzoneProps,
  className,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  // ─── Configuración de Dropzone ────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && dropzoneProps?.onFilesDropped) {
      dropzoneProps.onFilesDropped(acceptedFiles);
    }
  }, [dropzoneProps]);

  const { getRootProps, getInputProps, isDragActive: isDropActive } = useDropzone({
    onDrop,
    accept: dropzoneProps?.accept,
    multiple: dropzoneProps?.multiple ?? false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    noClick: !dropzoneProps,
    noKeyboard: !dropzoneProps,
  });

  const config = sizeConfig[size];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: DROPZONE VARIANT
  // ═══════════════════════════════════════════════════════════════════════════

  if (variant === 'dropzone') {
    return (
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center',
            'rounded-2xl border-2 border-dashed transition-all duration-300',
            config.py, config.px,
            isDropActive || isDragActive
              ? 'border-emerald-500 bg-emerald-500/5 cursor-pointer'
              : 'border-slate-700 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-500 cursor-pointer',
            'group'
          )}
        >
          <input {...getInputProps()} />
          
          {/* Icono con animación */}
          <motion.div
            variants={iconBounce}
            initial="initial"
            animate="animate"
            className={cn(
              config.iconBox,
              'flex items-center justify-center rounded-2xl mb-6',
              'bg-gradient-to-br from-emerald-500 to-emerald-600',
              'shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30',
              'transition-shadow duration-300'
            )}
          >
            <Upload size={config.iconSize - 8} className="text-white" />
          </motion.div>

          {/* Título */}
          <motion.h3
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className={cn('font-semibold text-foreground mb-2', config.title)}
          >
            {isDropActive ? '¡Suelta el archivo!' : title}
          </motion.h3>

          {/* Descripción */}
          {description && (
            <motion.p
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className={cn('text-muted-foreground mb-6 max-w-sm', config.desc)}
            >
              {description}
            </motion.p>
          )}

          {/* Botones */}
          {(primaryAction || secondaryAction) && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              {primaryAction && (
                <Button 
                  onClick={primaryAction.onClick}
                  leftIcon={primaryAction.icon || Upload}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button 
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  leftIcon={secondaryAction.icon}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: DEFAULT VARIANT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.py, config.px,
        className
      )}
    >
      {/* Icono decorativo */}
      {Icon && (
        <motion.div
          variants={iconBounce}
          initial="initial"
          animate="animate"
          className={cn(
            config.iconBox,
            'flex items-center justify-center rounded-2xl mb-6',
            'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
            'border border-emerald-500/20'
          )}
        >
          <Icon 
            size={config.iconSize - 8} 
            className="text-emerald-500 dark:text-emerald-400" 
          />
        </motion.div>
      )}

      {/* Título */}
      <motion.h3
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className={cn('font-semibold text-foreground mb-2', config.title)}
      >
        {title}
      </motion.h3>

      {/* Descripción */}
      {description && (
        <motion.p
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className={cn('text-muted-foreground mb-6 max-w-sm', config.desc)}
        >
          {description}
        </motion.p>
      )}

      {/* Botones de acción */}
      {(primaryAction || secondaryAction) && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon || Plus}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="outline"
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}

      {/* Decorador inferior - dots */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="mt-8 flex items-center gap-1.5 opacity-20"
      >
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <div className="w-2 h-2 rounded-full bg-slate-300" />
        <div className="w-2 h-2 rounded-full bg-slate-200" />
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS - Estados preconfigurados para reuse rápido
// ═══════════════════════════════════════════════════════════════════════════

export const EmptyStatePresets = {
  /**
   * Empty State para Dashboard sin proyectos
   */
  noProjects: (onCreate: () => void) => ({
    variant: 'default' as const,
    icon: Package,
    title: 'Sin proyectos',
    description: 'Crea tu primer proyecto para comenzar a gestionar tu construcción',
    primaryAction: {
      label: 'Crear Proyecto',
      onClick: onCreate,
      icon: Plus,
    },
    size: 'md' as const,
  }),

  /**
   * Empty State para Presupuestos sin datos - Dropzone Excel
   */
  noBudgets: (onImport: () => void, onCreate: () => void) => ({
    variant: 'dropzone' as const,
    title: 'Arrastra tu Excel aquí',
    description: 'Usa nuestro Bulk Importer para importar presupuestos desde Excel',
    primaryAction: {
      label: 'Importar Excel',
      onClick: onImport,
      icon: FileSpreadsheet,
    },
    secondaryAction: {
      label: 'Crear desde cero',
      onClick: onCreate,
      icon: Plus,
    },
    dropzoneProps: {
      accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'],
        'application/vnd.ms-excel': ['.xls'],
      },
      multiple: false,
    },
    size: 'lg' as const,
  }),

  /**
   * Empty State para BIM/IFC sin modelos
   */
  noBIM: (onUpload: () => void) => ({
    variant: 'dropzone' as const,
    icon: Box,
    title: 'Sube tu primer modelo IFC',
    description: 'Importa modelos 3D de Revit, ArchiCAD u otros software BIM para habilitar el despegue de cantidades 3D',
    primaryAction: {
      label: 'Subir Modelo IFC',
      onClick: onUpload,
      icon: Upload,
    },
    dropzoneProps: {
      accept: {
        'application/octet-stream': ['.ifc'],
        'model/x-ifc': ['.ifc'],
      },
      multiple: false,
    },
    size: 'lg' as const,
  }),

  /**
   * Empty State genérico para búsquedas sin resultados
   */
  noResults: (onClear: () => void) => ({
    variant: 'default' as const,
    icon: Search,
    title: 'Sin resultados',
    description: 'No encontramos nada con esos filtros. Intenta con otros términos.',
    primaryAction: {
      label: 'Limpiar filtros',
      onClick: onClear,
      icon: X,
    },
    size: 'sm' as const,
  }),
};

// Helper para search icon si no está disponible
const X = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const Search = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);