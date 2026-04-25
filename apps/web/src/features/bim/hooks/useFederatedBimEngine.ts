/**
 * useFederatedBimEngine — Advanced BIM Engine for Multi-Discipline Federation
 * 
 * Extends useBimEngine with:
 * - Multi-model federation (Architecture, Structure, MEP)
 * - Spatial coordination with shared origin
 * - Discipline-based visibility toggles
 * - Advanced clash detection capabilities
 * - Performance optimization for large federated models
 */
import { useRef, useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { useBimEngine } from './useBimEngine';
import { type BimSelectedElement } from "../types";

export enum ModelDiscipline {
  ARCHITECTURE = 'architecture',
  STRUCTURE = 'structure',
  MEP_HVAC = 'mep_hvac',
  MEP_PLUMBING = 'mep_plumbing',
  MEP_ELECTRICAL = 'mep_electrical',
  TOPOGRAPHY = 'topography',
  LANDSCAPE = 'landscape'
}

export interface FederatedModel {
  id: string;
  name: string;
  discipline: ModelDiscipline;
  url?: string;
  buffer?: Uint8Array;
  isVisible: boolean;
  isLoaded: boolean;
  loadProgress: number;
  color?: THREE.Color;
  opacity?: number;
  model?: any; // ThatOpen model reference
}

export interface ClashDetectionSettings {
  tolerance: number; // mm
  enabledDisciplines: ModelDiscipline[];
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface DetectedClash {
  id: string;
  elementA: {
    modelId: string;
    discipline: ModelDiscipline;
    guid: string;
    expressID: number;
    name: string;
  };
  elementB: {
    modelId: string;
    discipline: ModelDiscipline;
    guid: string;
    expressID: number;
    name: string;
  };
  clashType: 'hard' | 'soft' | 'clearance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  intersectionVolume: number;
  center: THREE.Vector3;
  status: 'open' | 'assigned' | 'resolved' | 'ignored';
  assignedTo?: string;
  comments?: string[];
  createdAt: Date;
}

export interface FederatedBimState {
  models: Map<string, FederatedModel>;
  totalModels: number;
  loadedModels: number;
  overallProgress: number;
  isDetectingClashes: boolean;
  detectedClashes: DetectedClash[];
  clashDetectionSettings: ClashDetectionSettings;
}

interface UseFederatedBimEngineOptions {
  onElementSelect?: (element: BimSelectedElement) => void;
  onClashDetected?: (clashes: DetectedClash[]) => void;
  onModelLoaded?: (model: FederatedModel) => void;
}

const DISCIPLINE_COLORS: Record<ModelDiscipline, THREE.Color> = {
  [ModelDiscipline.ARCHITECTURE]: new THREE.Color('#E5E7EB'), // Gray-200
  [ModelDiscipline.STRUCTURE]: new THREE.Color('#DC2626'), // Red-600
  [ModelDiscipline.MEP_HVAC]: new THREE.Color('#2563EB'), // Blue-600
  [ModelDiscipline.MEP_PLUMBING]: new THREE.Color('#059669'), // Emerald-600
  [ModelDiscipline.MEP_ELECTRICAL]: new THREE.Color('#D97706'), // Amber-600
  [ModelDiscipline.TOPOGRAPHY]: new THREE.Color('#92400E'), // Amber-800
  [ModelDiscipline.LANDSCAPE]: new THREE.Color('#15803D'), // Green-700
};

export function useFederatedBimEngine(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: UseFederatedBimEngineOptions,
) {
  // Base BIM engine
  const baseBim = useBimEngine(containerRef, {
    onElementSelect: options?.onElementSelect,
  });

  // Federated state
  const [federatedState, setFederatedState] = useState<FederatedBimState>({
    models: new Map(),
    totalModels: 0,
    loadedModels: 0,
    overallProgress: 0,
    isDetectingClashes: false,
    detectedClashes: [],
    clashDetectionSettings: {
      tolerance: 10, // 10mm default
      enabledDisciplines: Object.values(ModelDiscipline),
      severityThreshold: 'medium',
    },
  });

  // Refs for federated operations
  const clashWorkerRef = useRef<Worker | null>(null);
  const spatialIndexRef = useRef<Map<string, THREE.Box3>>(new Map());
  const disciplineGroupsRef = useRef<Map<ModelDiscipline, THREE.Group>>(new Map());

  /**
   * Initialize discipline groups in the scene
   */
  const initializeDisciplineGroups = useCallback(() => {
    // This will be called after base engine initialization
    Object.values(ModelDiscipline).forEach(discipline => {
      const group = new THREE.Group();
      group.name = discipline;
      group.userData = { discipline, visible: true };
      disciplineGroupsRef.current.set(discipline, group);
    });
  }, []);

  /**
   * Add a model to the federation
   */
  const addModel = useCallback(async (
    id: string,
    name: string,
    discipline: ModelDiscipline,
    buffer: Uint8Array
  ) => {
    const newModel: FederatedModel = {
      id,
      name,
      discipline,
      buffer,
      isVisible: true,
      isLoaded: false,
      loadProgress: 0,
      color: DISCIPLINE_COLORS[discipline],
      opacity: discipline === ModelDiscipline.ARCHITECTURE ? 0.8 : 1.0,
    };

    setFederatedState(prev => ({
      ...prev,
      models: new Map(prev.models.set(id, newModel)),
      totalModels: prev.totalModels + 1,
    }));

    try {
      // Initialize engine if not ready
      if (!baseBim.viewerState.isModelLoaded && baseBim.initEngine) {
        await baseBim.initEngine();
      }

      // Load the model using base engine
      await baseBim.loadIfc(buffer, name);

      // Update model state
      setFederatedState(prev => {
        const updatedModel = { ...newModel, isLoaded: true, loadProgress: 100 };
        const updatedModels = new Map(prev.models.set(id, updatedModel));
        
        return {
          ...prev,
          models: updatedModels,
          loadedModels: prev.loadedModels + 1,
          overallProgress: (prev.loadedModels + 1) / prev.totalModels * 100,
        };
      });

      options?.onModelLoaded?.(newModel);

    } catch (error) {
      // Update model with error state
      setFederatedState(prev => {
        const failedModel = { ...newModel, isLoaded: false, loadProgress: 0 };
        return {
          ...prev,
          models: new Map(prev.models.set(id, failedModel)),
        };
      });
    }
  }, [baseBim.initEngine, baseBim.loadIfc, options]);

  /**
   * Remove a model from the federation
   */
  const removeModel = useCallback((modelId: string) => {
    setFederatedState(prev => {
      const newModels = new Map(prev.models);
      const model = newModels.get(modelId);
      
      if (model?.model) {
        // Dispose model resources
        try {
          if (model.model.dispose) model.model.dispose();
        } catch (e) {
          // Model disposal failed — non-critical
        }
      }
      
      newModels.delete(modelId);
      
      return {
        ...prev,
        models: newModels,
        totalModels: Math.max(0, prev.totalModels - 1),
        loadedModels: model?.isLoaded ? Math.max(0, prev.loadedModels - 1) : prev.loadedModels,
      };
    });
  }, []);

  /**
   * Toggle visibility of a discipline
   */
  const toggleDisciplineVisibility = useCallback((discipline: ModelDiscipline) => {
    setFederatedState(prev => {
      const newModels = new Map();
      
      for (const [id, model] of prev.models) {
        if (model.discipline === discipline) {
          const updatedModel = { ...model, isVisible: !model.isVisible };
          newModels.set(id, updatedModel);
          
          // Update Three.js visibility
          const group = disciplineGroupsRef.current.get(discipline);
          if (group) {
            group.visible = updatedModel.isVisible;
          }
        } else {
          newModels.set(id, model);
        }
      }
      
      return { ...prev, models: newModels };
    });
  }, []);

  /**
   * Update clash detection settings
   */
  const updateClashSettings = useCallback((settings: Partial<ClashDetectionSettings>) => {
    setFederatedState(prev => ({
      ...prev,
      clashDetectionSettings: { ...prev.clashDetectionSettings, ...settings },
    }));
  }, []);

  /**
   * Perform clash detection between enabled disciplines
   */
  const detectClashes = useCallback(async () => {
    if (federatedState.loadedModels < 2) {
      return;
    }

    setFederatedState(prev => ({ ...prev, isDetectingClashes: true }));

    try {
      // Initialize clash worker if not exists
      if (!clashWorkerRef.current) {
        clashWorkerRef.current = new Worker('/workers/clash-detection.worker.js');
      }

      const worker = clashWorkerRef.current;
      const { tolerance, enabledDisciplines } = federatedState.clashDetectionSettings;

      // Prepare model data for worker
      const modelData = Array.from(federatedState.models.values())
        .filter(model => 
          model.isLoaded && 
          model.isVisible && 
          enabledDisciplines.includes(model.discipline)
        )
        .map(model => ({
          id: model.id,
          discipline: model.discipline,
          // Extract geometry data from Three.js model
          // This would need to be implemented based on ThatOpen model structure
        }));

      // Send clash detection job to worker
      worker.postMessage({
        type: 'DETECT_CLASHES',
        payload: {
          models: modelData,
          tolerance,
          timestamp: Date.now(),
        },
      });

      // Handle worker response
      worker.onmessage = (event) => {
        const { type, payload } = event.data;
        
        if (type === 'CLASHES_DETECTED') {
          const detectedClashes: DetectedClash[] = payload.clashes.map((clash: any) => ({
            ...clash,
            id: `clash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'open' as const,
            createdAt: new Date(),
          }));

          setFederatedState(prev => ({
            ...prev,
            detectedClashes,
            isDetectingClashes: false,
          }));

          options?.onClashDetected?.(detectedClashes);
        } else if (type === 'CLASH_DETECTION_ERROR') {
          setFederatedState(prev => ({ ...prev, isDetectingClashes: false }));
        }
      };

    } catch (error) {
      setFederatedState(prev => ({ ...prev, isDetectingClashes: false }));
    }
  }, [federatedState.models, federatedState.loadedModels, federatedState.clashDetectionSettings, options]);

  /**
   * Navigate to a specific clash
   */
  const navigateToClash = useCallback(async (clash: DetectedClash) => {
    if (!baseBim.controls) return;

    try {
      // Calculate camera position to focus on clash
      const clashCenter = clash.center;
      const offset = new THREE.Vector3(10, 10, 10);
      const cameraPosition = clashCenter.clone().add(offset);

      // Move camera to clash location
      if (baseBim.controls.resetView) {
        // Custom navigation logic would go here
        // This depends on the ThatOpen camera control API
      }

      // Highlight the clashing elements
      const elementsToHighlight = [clash.elementA.guid, clash.elementB.guid];
      if (baseBim.controls.highlightLinkedElements) {
        await baseBim.controls.highlightLinkedElements(elementsToHighlight);
      }

    } catch (error) {
      // Navigate to clash failed — non-critical
    }
  }, [baseBim.controls]);

  /**
   * Update clash status
   */
  const updateClashStatus = useCallback((clashId: string, status: DetectedClash['status'], assignedTo?: string) => {
    setFederatedState(prev => ({
      ...prev,
      detectedClashes: prev.detectedClashes.map(clash =>
        clash.id === clashId
          ? { ...clash, status, assignedTo }
          : clash
      ),
    }));
  }, []);

  /**
   * Add comment to clash
   */
  const addClashComment = useCallback((clashId: string, comment: string) => {
    setFederatedState(prev => ({
      ...prev,
      detectedClashes: prev.detectedClashes.map(clash =>
        clash.id === clashId
          ? { ...clash, comments: [...(clash.comments || []), comment] }
          : clash
      ),
    }));
  }, []);

  /**
   * Cleanup federated resources
   */
  useEffect(() => {
    return () => {
      // Dispose clash worker
      if (clashWorkerRef.current) {
        clashWorkerRef.current.terminate();
        clashWorkerRef.current = null;
      }

      // Clear spatial index
      spatialIndexRef.current.clear();

      // Clear discipline groups
      disciplineGroupsRef.current.clear();
    };
  }, []);

  // Initialize discipline groups when base engine is ready
  useEffect(() => {
    if (baseBim.viewerState.isModelLoaded) {
      initializeDisciplineGroups();
    }
  }, [baseBim.viewerState.isModelLoaded, initializeDisciplineGroups]);

  return {
    // Expose base BIM functionality
    ...baseBim,
    
    // Federated-specific state and controls
    federatedState,
    
    // Model management
    addModel,
    removeModel,
    toggleDisciplineVisibility,
    
    // Clash detection
    detectClashes,
    navigateToClash,
    updateClashStatus,
    addClashComment,
    updateClashSettings,
    
    // Utility
    disciplines: Object.values(ModelDiscipline),
    disciplineColors: DISCIPLINE_COLORS,
  };
}