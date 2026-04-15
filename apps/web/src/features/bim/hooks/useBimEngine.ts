/**
 * useBimEngine — Core React Hook for ThatOpen/Three.js BIM Engine
 * 
 * Manages the full lifecycle of the 3D BIM viewer:
 * - Initializes OBC.Components, World (Scene, Camera, Renderer)
 * - Configures FragmentsManager with web worker
 * - Loads IFC files via IfcLoader
 * - Sets up Highlighter (auto click-to-select + hover) from @thatopen/components-front
 * - Provides element picking via Highlighter events
 * - Provides camera control methods
 * - Handles cleanup/disposal on unmount
 */
import { useRef, useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { type BimEngineControls, type BimSelectedElement, type BimViewerState } from "../types";
import { useIfcQuantifier } from './useIfcQuantifier';

const WASM_PATH = '/bim/';
const WORKER_URL = '/bim/fragments-worker.mjs';

// Highlight colors
const HIGHLIGHT_SELECT_COLOR = new THREE.Color('#6366f1'); // Indigo-500
const HIGHLIGHT_LINKED_COLOR = new THREE.Color('#10b981'); // Emerald-500

interface UseBimEngineOptions {
  onElementSelect?: (element: BimSelectedElement) => void;
}

export function useBimEngine(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: UseBimEngineOptions,
) {
  // 1. Primitive State (Priority for React reconciliation)
  const [viewerState, setViewerState] = useState<BimViewerState>({
    isLoading: false,
    progress: 0,
    progressMessage: '',
    error: null,
    isModelLoaded: false,
  });

  const [selectedElement, setSelectedElement] = useState<BimSelectedElement | null>(null);

  // 2. Refs (Stable memory)
  const componentsRef = useRef<OBC.Components | null>(null);
  const worldRef = useRef<any>(null);
  const fragmentsRef = useRef<any>(null);
  const highlighterRef = useRef<OBF.Highlighter | null>(null);
  const plansRef = useRef<OBC.Views | null>(null);
  const isInitializedRef = useRef(false);
  const isInitializingRef = useRef<Promise<void> | null>(null);
  const isDisposedRef = useRef(false);
  const loadedModelsRef = useRef<Map<string, any>>(new Map());
  const globalIdMapRef = useRef<Map<string, { modelId: string; expressID: number }>>(new Map());
  
  // New state for plans/levels
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // Store options in ref so callbacks don't go stale
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { quantifyElement } = useIfcQuantifier(componentsRef);

  /**
   * Initialize the ThatOpen engine
   */
  const initEngine = useCallback(async () => {
    if (isInitializedRef.current || isDisposedRef.current || isInitializingRef.current) return;
    if (!containerRef.current) return;

    const initPromise = (async () => {
      try {
        // Robust container check with retry loop
        let container = containerRef.current;
        let mountRetries = 0;
        while (!container && mountRetries < 20) {
          console.log(`[BimEngine] Waiting for container mount (attempt ${mountRetries + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 100));
          container = containerRef.current;
          mountRetries++;
        }

        if (!container) {
          throw new Error('Container not mounted after 2s. Aborting 3D init.');
        }

        console.log('[BimEngine] Initializing components (Industrial mode)...');
        const components = new OBC.Components();
        componentsRef.current = components;

        // Explicitly initialize engine cores
        await components.init();

        console.log('[BimEngine] 2. Creating World...');
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBF.PostproductionRenderer
        >();
        worldRef.current = world;
        
        world.scene = new OBC.SimpleScene(components);
        const renderer = new OBF.PostproductionRenderer(components, container);
        world.renderer = renderer;
        
        const camera = new OBC.OrthoPerspectiveCamera(components);
        world.camera = camera;

        // Verify container is still attached before renderer init
        if (!container.parentElement && mountRetries < 20) {
           throw new Error('Container detached during initialization');
        }

        console.log('[BimEngine] 2.1 Initializing Fragments Manager...');
        const fragments = components.get(OBC.FragmentsManager);
        fragmentsRef.current = fragments;

        // Wait for controls to be ready (Extended timeout to 3s for slower devices)
        let controlsReady = false;
        let retries = 0;
        while (!controlsReady && retries < 60) {
          try {
            if (camera.controls) {
              controlsReady = true;
            }
          } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 50));
            retries++;
          }
        }

        if (!controlsReady) {
          throw new Error('Controls synchronization failed. Time out after 3s.');
        }

        console.log('[BimEngine] 3. Configuring Scene...');
        world.scene.setup();
        
        // Elevate visual quality with Post-production
        const postproduction = world.renderer.postproduction;
        postproduction.enabled = true;
        postproduction.outlinesEnabled = true;
        
        // Activate AO for realistic building depth
        const aoPass = postproduction.aoPass;
        aoPass.enabled = true;
        
        // Calibrate shadows for industrial-grade depth
        // @ts-ignore - Leveraging underlying GTAOPass properties for premium rendering
        aoPass.radius = 0.5;
        // @ts-ignore
        aoPass.scale = 1.2;

        console.log('[BimEngine] 4. Initializing Components...');

        console.log('[BimEngine] 7. Configuring Visuals...');
        const activeScene = world.scene;
        activeScene.three.background = null; 
        
        // Initialize raycaster
        void components.get(OBC.Raycasters).get(world);
        
        // 5. Initialize Views Tool (Modern floor plan management)
        const plans = components.get(OBC.Views);
        plans.world = world;
        plansRef.current = plans;
        
        try {
          // Resilient Blob-based worker loading
          const fetchedUrl = await fetch(WORKER_URL);
          const workerBlob = await fetchedUrl.blob();
          const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
          const workerUrl = URL.createObjectURL(workerFile);
          cleanupFunctionsRef.current.push(() => URL.revokeObjectURL(workerUrl));
          
          fragments.init(workerUrl);
          console.log('[BimEngine] Fragments worker initialized via Blob.');
        } catch (e) {
          console.warn('[BimEngine] Worker fetch/init failed, falling back to direct URL:', e);
          try {
            fragments.init(WORKER_URL);
          } catch (err) {
            console.error('[BimEngine] Critical Worker Failure:', err);
          }
        }

        // Professional lighting: Replaced simple lights with Hemisphere + Directional setup
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        world.scene.three.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 50, 10);
        directionalLight.castShadow = true; // Premium shadows enabled
        world.scene.three.add(directionalLight);

        const softLight = new THREE.PointLight(0xffffff, 0.3);
        softLight.position.set(-20, 10, -20);
        world.scene.three.add(softLight);

        // Configure camera position with guaranteed controls
        await world.camera.controls.setLookAt(30, 20, 30, 0, 0, 0, true);
        
        // Add grids
        const grids = components.get(OBC.Grids);
        grids.create(world);

        // Update fragments on camera movement
        const onCameraUpdate = () => {
          if (!isDisposedRef.current) {
            fragments.core.update();
          }
        };
        world.camera.controls.addEventListener('update', onCameraUpdate);
        cleanupFunctionsRef.current.push(() => {
          try {
            world.camera.controls.removeEventListener('update', onCameraUpdate);
          } catch { /* ignore */ }
        });

        // When a model is loaded, add it to the scene
        const onModelLoaded = ({ value: model }: { value: any }) => {
          if (isDisposedRef.current) return;
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);

          // Store reference for property lookups
          const modelId = model.uuid || model.id || `model-${loadedModelsRef.current.size}`;
          loadedModelsRef.current.set(modelId, model);

          // Build GlobalId index for visual feedback
          (async () => {
            console.log('[BimEngine] Model loaded. Generating Floor Plans...');
            const plans = plansRef.current;
            if (plans) {
              try {
                const storeys = await plans.createFromIfcStoreys();
                const planList = storeys.map((view: any) => ({
                  id: view.uuid || (view as any).id,
                  name: view.name || 'Nivel Desconocido',
                }));
                setAvailablePlans(planList);
                console.log(`[BimEngine] Generated ${planList.length} floor plans.`);
              } catch (e) {
                console.warn('[BimEngine] Error generating storeys:', e);
              }
            }
          })();
        };
        fragments.list.onItemSet.add(onModelLoaded);
        cleanupFunctionsRef.current.push(() => {
          fragments.list.onItemSet.remove(onModelLoaded);
        });

        // Fix z-fighting
        const onMaterialSet = ({ value: material }: { value: any }) => {
          if (!('isLodMaterial' in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = Math.random();
          }
        };
        fragments.core.models.materials.list.onItemSet.add(onMaterialSet);
        cleanupFunctionsRef.current.push(() => {
          fragments.core.models.materials.list.onItemSet.remove(onMaterialSet);
        });

        // 4. Configure Highlighter with auto click-to-select
        try {
          const highlighter = components.get(OBF.Highlighter);
          highlighter.setup({
            world,
            autoHighlightOnClick: true,
            selectionColor: HIGHLIGHT_SELECT_COLOR,
          });
          
          // Add a secondary state for linked elements (Budgeted)
          // @ts-ignore - Some versions of Highlighter use a slightly different signature
          highlighter.add('linked', HIGHLIGHT_LINKED_COLOR);

          highlighterRef.current = highlighter;

          // Listen for select events to extract IFC properties
          const selectName = highlighter.config.selectName || 'select';
          if (highlighter.events[selectName]) {
            highlighter.events[selectName].onHighlight.add(async (modelIdMap: OBC.ModelIdMap) => {
              if (isDisposedRef.current) return;

              // Extract first selected element
              for (const [modelId, expressIDs] of Object.entries(modelIdMap)) {
                const firstId = [...expressIDs][0];
                if (firstId === undefined) continue;

                // Find the model
                const model = loadedModelsRef.current.get(modelId) ||
                  [...loadedModelsRef.current.values()][0];

                if (model) {
                  const element = await quantifyElement(model, firstId, modelId);
                  if (element) {
                    setSelectedElement(element);
                    optionsRef.current?.onElementSelect?.(element);
                  }
                }
                break; // Only process first element
              }
            });

            highlighter.events[selectName].onClear.add(() => {
              if (!isDisposedRef.current) {
                setSelectedElement(null);
              }
            });
          }
        } catch (e) {
          console.warn('[BimEngine] Highlighter setup warning:', e);
          // Continue without highlighter — not critical
        }

        isInitializedRef.current = true;
        isInitializingRef.current = null;
        console.log('[BimEngine] Initialized successfully.');
      } catch (error) {
        console.error('[BimEngine] Failed to initialize:', error);
        isInitializingRef.current = null;
        setViewerState((prev: BimViewerState) => ({
          ...prev,
          error: `Error al inicializar el visor 3D: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        }));
      }
    })();

    isInitializingRef.current = initPromise;
    return initPromise;
  }, [containerRef, quantifyElement]);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(async () => {
    setSelectedElement(null);
    if (highlighterRef.current) {
      try {
        await highlighterRef.current.clear();
      } catch { /* ignore */ }
    }
  }, []);

  /**
   * Load an IFC file from a Uint8Array buffer
   */
  const loadIfc = useCallback(async (buffer: Uint8Array, name?: string) => {
    if (!componentsRef.current || !isInitializedRef.current) {
      await initEngine();
    }

    if (!componentsRef.current) {
      setViewerState((prev: BimViewerState) => ({
        ...prev,
        error: 'El motor 3D no se pudo inicializar',
      }));
      return;
    }

    setViewerState({
      isLoading: true,
      progress: 0,
      progressMessage: 'Configurando parser IFC...',
      error: null,
      isModelLoaded: false,
    });

    try {
      const ifcLoader = componentsRef.current.get(OBC.IfcLoader);

      // Configure WASM path
      await ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: WASM_PATH,
          absolute: true,
        },
      });

      setViewerState((prev: BimViewerState) => ({
        ...prev,
        progress: 10,
        progressMessage: 'Convirtiendo modelo IFC a Fragments...',
      }));

      // Track progress
      ifcLoader.onIfcImporterInitialized.add(() => {
        setViewerState((prev: BimViewerState) => ({
          ...prev,
          progress: 30,
          progressMessage: 'Procesando geometría del modelo...',
        }));
      });

      // Load the IFC file (model is added to scene automatically via FragmentsManager)
      await ifcLoader.load(buffer, false, name || 'model', {
        processData: {
          progressCallback: (progress: number) => {
            const pct = Math.min(30 + Math.round(progress * 60), 90);
            setViewerState((prev: BimViewerState) => ({
              ...prev,
              progress: pct,
              progressMessage: pct < 60
                ? 'Procesando geometría del modelo...'
                : pct < 80
                  ? 'Aplicando materiales...'
                  : 'Finalizando carga...',
            }));
          },
        },
      });

      // Fit camera to loaded model
      if (worldRef.current?.camera) {
        await worldRef.current.camera.controls.setLookAt(30, 20, 30, 0, 5, 0);
      }

      setViewerState({
        isLoading: false,
        progress: 100,
        progressMessage: 'Modelo cargado correctamente',
        error: null,
        isModelLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load IFC:', error);
      setViewerState({
        isLoading: false,
        progress: 0,
        progressMessage: '',
        error: `Error al cargar el modelo IFC: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        isModelLoaded: false,
      });
    }
  }, [initEngine]);

  /**
   * Highlight a specific set of elements (linked to budget)
   */
  const highlightLinkedElements = useCallback(async (globalIds: string[]) => {
    if (!highlighterRef.current || globalIds.length === 0) {
      if (highlighterRef.current) {
        try {
          await highlighterRef.current.clear('linked');
        } catch { /* ignore */ }
      }
      return;
    }

    console.log('[BimEngine] Highlighting linked elements:', globalIds.length);
    
    const fragmentIdMap: any = {};
    
    // Map GlobalIds to FragmentIdMap
    for (const globalId of globalIds) {
      const mapping = globalIdMapRef.current.get(globalId);
      if (mapping) {
        const { modelId, expressID } = mapping;
        const model = loadedModelsRef.current.get(modelId);
        if (model) {
          for (const fragment of model.items) {
            const expressIDs = fragmentIdMap[fragment.id] || new Set();
            expressIDs.add(expressID);
            fragmentIdMap[fragment.id] = expressIDs;
          }
        }
      }
    }

    try {
      if (highlighterRef.current) {
        await highlighterRef.current.clear('linked');
        if (Object.keys(fragmentIdMap).length > 0) {
          await highlighterRef.current.highlightByID('linked', fragmentIdMap, true, false);
        }
      }
    } catch (e) {
      console.warn('[BimEngine] Linked highlight error:', e);
    }
  }, []);

  /**
   * Camera control methods
   */
  const controls: BimEngineControls = {
    resetView: () => {
      if (worldRef.current?.camera) {
        worldRef.current.camera.controls.setLookAt(30, 20, 30, 0, 5, 0);
      }
    },
    zoomIn: () => {
      if (worldRef.current?.camera) {
        worldRef.current.camera.controls.dolly(3, true);
      }
    },
    zoomOut: () => {
      if (worldRef.current?.camera) {
        worldRef.current.camera.controls.dolly(-3, true);
      }
    },
    toggleProjection: () => {
      if (worldRef.current?.camera) {
        const cam = worldRef.current.camera as OBC.OrthoPerspectiveCamera;
        cam.projection.toggle();
      }
    },
    fitToModel: () => {
      if (worldRef.current?.camera) {
        worldRef.current.camera.controls.setLookAt(30, 20, 30, 0, 5, 0);
      }
    },
    highlightLinkedElements,
    goToPlan: async (id: string) => {
      if (plansRef.current && worldRef.current) {
        try {
          plansRef.current.open(id);
          setActivePlanId(id);
          // Enable white background for better plan visibility
          worldRef.current.scene.three.background = new THREE.Color(0xffffff);
        } catch (e) {
          console.error('[BimEngine] Error moving to plan:', e);
        }
      }
    },
    exitPlan: async () => {
      if (plansRef.current && worldRef.current) {
        try {
          plansRef.current.close();
          setActivePlanId(null);
          // Restore transparent/themed background
          worldRef.current.scene.three.background = null;
        } catch (e) {
          console.error('[BimEngine] Error exiting plan:', e);
        }
      }
    }
  };

  /**
   * Cleanup on unmount — Comprehensive WebGL resource disposal
   * Prevents memory leaks by releasing GPU resources, geometries, materials,
   * textures, and properly destroying the WebGL context.
   */
  useEffect(() => {
    return () => {
      isDisposedRef.current = true;
      console.log('[BimEngine] Starting strict cleanup...');

      // 1. Dispose all loaded models (geometries, materials, textures)
      if (loadedModelsRef.current.size > 0) {
        for (const [modelId, model] of loadedModelsRef.current) {
          try {
            console.log(`[BimEngine] Disposing model: ${modelId}`);
            if (model.dispose) {
              model.dispose();
            }
            // If the model object exists in Three.js
            if (model.object) {
              model.object.traverse((obj: THREE.Object3D) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                if ((obj as THREE.Mesh).material) {
                  const mat = (obj as THREE.Mesh).material;
                  if (Array.isArray(mat)) mat.forEach(m => m.dispose());
                  else mat.dispose();
                }
              });
            }
          } catch (e) {
            console.warn(`[BimEngine] Error disposing model ${modelId}:`, e);
          }
        }
        loadedModelsRef.current.clear();
      }

      // 2. Clear GlobalId index
      globalIdMapRef.current.clear();

      // 3. Dispose Highlighter
      if (highlighterRef.current) {
        try {
          highlighterRef.current.dispose();
        } catch (e) {
          console.warn('[BimEngine] Error disposing highlighter:', e);
        }
        highlighterRef.current = null;
      }

      // 4. Dispose FragmentsManager and terminate workers
      if (fragmentsRef.current) {
        try {
          const fragments = fragmentsRef.current;
          // Dispose all individual fragments and their meshes
          if (fragments.list) {
            for (const [, fragment] of fragments.list) {
              if (fragment.dispose) fragment.dispose();
              if (fragment.mesh) {
                fragment.mesh.geometry?.dispose();
                if (Array.isArray(fragment.mesh.material)) {
                  fragment.mesh.material.forEach((m: any) => m.dispose());
                } else {
                  fragment.mesh.material?.dispose();
                }
              }
            }
            fragments.list.clear();
          }
          
          if (fragments.dispose) fragments.dispose();
        } catch (e) {
          console.warn('[BimEngine] Error disposing fragments:', e);
        }
        fragmentsRef.current = null;
      }

      // 5. Dispose World (Scene, Camera, Renderer)
      if (worldRef.current) {
        try {
          const world = worldRef.current;

          // Dispose scene objects recursively
          if (world.scene?.three) {
            world.scene.three.traverse((object: THREE.Object3D) => {
              if ((object as THREE.Mesh).geometry) {
                (object as THREE.Mesh).geometry.dispose();
              }
              if ((object as THREE.Mesh).material) {
                const material = (object as THREE.Mesh).material;
                if (Array.isArray(material)) {
                  material.forEach(mat => mat.dispose());
                } else {
                  material.dispose();
                }
              }
              // Dispose textures if any
              if ((object as any).map) (object as any).map.dispose();
            });
            // Clear the scene
            world.scene.three.clear();
          }

          // Dispose renderer and its WebGL context
          if (world.renderer) {
            const renderer = world.renderer.three;
            if (renderer) {
              renderer.dispose();
              renderer.forceContextLoss();
              if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
              }
            }
            if (world.renderer.dispose) world.renderer.dispose();
          }

          if (world.dispose) world.dispose();
        } catch (e) {
          console.warn('[BimEngine] Error disposing world:', e);
        }
        worldRef.current = null;
      }

      // 6. Dispose Components (final cleanup)
      if (componentsRef.current) {
        try {
          // Dispose all component tools that might have their own dispose methods
          componentsRef.current.dispose();
        } catch (e) {
          console.warn('[BimEngine] Error disposing components:', e);
        }
        componentsRef.current = null;
      }

      // 7. Clear container content and reference
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        // We don't nullify containerRef.current yet as React might still need it 
        // during the final phase of unmounting, but we clear it.
      }

      // 8. Final Reset
      isInitializedRef.current = false;
      isInitializingRef.current = null;
      
      // Execute cleanup functions
      cleanupFunctionsRef.current.forEach(fn => fn());
      cleanupFunctionsRef.current = [];

      console.log('[BimEngine] Strict cleanup complete.');
    };
  }, [containerRef]);

  return {
    viewerState,
    selectedElement,
    initEngine,
    loadIfc,
    controls,
    clearSelection,
    plans: {
      available: availablePlans,
      current: activePlanId,
    }
  };
}
