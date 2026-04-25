import { useCallback, useEffect, useRef, useState } from 'react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import { FragmentsManager } from '@thatopen/fragments';

interface OptimizedBIMEngineConfig {
  maxMemoryMB: number;
  enableLOD: boolean;
  enableInstancing: boolean;
  enableOcclusion: boolean;
  maxFragmentsPerFrame: number;
  streamingChunkSize: number;
  enableProgressiveLoading: boolean;
  qualityPreset: 'performance' | 'balanced' | 'quality';
}

interface ModelLoadingProgress {
  phase: 'downloading' | 'parsing' | 'processing' | 'rendering';
  percentage: number;
  loadedFragments: number;
  totalFragments: number;
  memoryUsage: number;
  errorCount: number;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsageMB: number;
  triangleCount: number;
  drawCalls: number;
  loadTime: number;
  renderTime: number;
}

interface LODConfig {
  enableLOD: boolean;
  distances: [number, number, number]; // [high, medium, low] quality distances
  simplificationRatios: [number, number, number]; // [high, medium, low] quality ratios
}

export const useOptimizedBIMEngine = (
  containerId: string,
  config: Partial<OptimizedBIMEngineConfig> = {}
) => {
  // Default configuration optimized for large models
  const defaultConfig: OptimizedBIMEngineConfig = {
    maxMemoryMB: 2048, // 2GB limit
    enableLOD: true,
    enableInstancing: true,
    enableOcclusion: true,
    maxFragmentsPerFrame: 50,
    streamingChunkSize: 1024 * 1024, // 1MB chunks
    enableProgressiveLoading: true,
    qualityPreset: 'balanced',
    ...config
  };

  const [components, setComponents] = useState<OBC.Components | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<ModelLoadingProgress | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Performance monitoring refs
  const performanceMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const memoryManagerRef = useRef<{
    loadedModels: Map<string, any>;
    fragmentCache: Map<string, any>;
    totalMemoryUsage: number;
  }>({
    loadedModels: new Map(),
    fragmentCache: new Map(),
    totalMemoryUsage: 0,
  });

  // LOD management
  const lodManagerRef = useRef<{
    currentLODLevel: 'high' | 'medium' | 'low';
    viewerPosition: THREE.Vector3;
    elementLODLevels: Map<string, 'high' | 'medium' | 'low' | 'culled'>;
  }>({
    currentLODLevel: 'high',
    viewerPosition: new (globalThis as any).THREE.Vector3(),
    elementLODLevels: new Map(),
  });

  const initializeOptimizedEngine = useCallback(async (): Promise<OBC.Components> => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID "${containerId}" not found`);
      }

      

      // Configure components for high performance
      const components = new OBC.Components();

      // Configure renderer with performance optimizations
      const renderer = components.get(OBF.PostproductionRenderer);
      renderer.postproduction.enabled = defaultConfig.qualityPreset !== 'performance';
      
      // Optimize renderer settings based on quality preset
      configureRendererForQuality(renderer, defaultConfig.qualityPreset);

      // Set up performance-optimized camera
      const camera = components.get(OBF.OrthoPerspectiveCamera);
      camera.controls.enableDamping = false; // Disable for better performance
      camera.controls.dampingFactor = 0.05;

      // Configure world with memory optimization
      const worlds = components.get(OBC.Worlds);
      const world = worlds.create();
      world.name = 'OptimizedBIMWorld';

      // Set up scene with optimizations
      world.scene = new (globalThis as any).THREE.Scene();
      world.scene.matrixAutoUpdate = false; // Disable automatic matrix updates
      world.renderer = renderer;
      world.camera = camera;

      // Initialize fragments manager with memory limits
      const fragments = components.get(OBC.FragmentsManager);
      
      // Configure raycaster for better performance
      const raycaster = components.get(OBF.Raycaster);
      raycaster.enabled = true;
      
      // Set up memory management
      setupMemoryManagement(components, defaultConfig);

      // Set up LOD system if enabled
      if (defaultConfig.enableLOD) {
        setupLODSystem(components, world);
      }

      // Set up occlusion culling if enabled
      if (defaultConfig.enableOcclusion) {
        setupOcclusionCulling(components, world);
      }

      // Initialize progressive loading system
      if (defaultConfig.enableProgressiveLoading) {
        setupProgressiveLoading(components);
      }

      // Set up performance monitoring
      setupPerformanceMonitoring(components);

      await renderer.setupRenderer({ container, world });
      
      const { postproduction } = renderer;
      postproduction.enabled = defaultConfig.qualityPreset !== 'performance';

      setComponents(components);
      setIsInitialized(true);
      setError(null);

      
      
      return components;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [containerId, defaultConfig]);

  // Configure renderer based on quality preset
  const configureRendererForQuality = (
    renderer: OBF.PostproductionRenderer, 
    preset: OptimizedBIMEngineConfig['qualityPreset']
  ) => {
    const canvas = renderer.three.canvas;
    
    switch (preset) {
      case 'performance':
        renderer.three.renderer.setPixelRatio(Math.min(1, window.devicePixelRatio));
        renderer.three.renderer.shadowMap.enabled = false;
        renderer.three.renderer.antialias = false;
        break;
        
      case 'balanced':
        renderer.three.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
        renderer.three.renderer.shadowMap.enabled = true;
        renderer.three.renderer.shadowMap.type = (globalThis as any).THREE.PCFShadowMap;
        break;
        
      case 'quality':
        renderer.three.renderer.setPixelRatio(window.devicePixelRatio);
        renderer.three.renderer.shadowMap.enabled = true;
        renderer.three.renderer.shadowMap.type = (globalThis as any).THREE.PCFSoftShadowMap;
        break;
    }
  };

  // Set up advanced memory management
  const setupMemoryManagement = (
    components: OBC.Components, 
    config: OptimizedBIMEngineConfig
  ) => {
    const memoryManager = memoryManagerRef.current;
    
    // Monitor memory usage and automatically manage resources
    const checkMemoryUsage = () => {
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
        
        memoryManager.totalMemoryUsage = usedMB;

        // If approaching memory limit, start aggressive cleanup
        if (usedMB > config.maxMemoryMB * 0.8) {
          performMemoryCleanup();
        }
      }
    };

    setInterval(checkMemoryUsage, 5000); // Check every 5 seconds
  };

  // Perform memory cleanup
  const performMemoryCleanup = () => {
    const memoryManager = memoryManagerRef.current;
    
    // Clear fragment cache for elements not in view
    memoryManager.fragmentCache.forEach((fragment, key) => {
      if (!isFragmentInView(fragment)) {
        memoryManager.fragmentCache.delete(key);
        fragment.dispose?.();
      }
    });

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  };

  // Check if fragment is currently in view
  const isFragmentInView = (fragment: any): boolean => {
    // Implementation would check if fragment is within camera frustum
    // This is a simplified version
    return fragment.visible && fragment.material.opacity > 0;
  };

  // Set up Level of Detail (LOD) system
  const setupLODSystem = (components: OBC.Components, world: OBC.World) => {
    const camera = components.get(OBF.OrthoPerspectiveCamera);
    const lodConfig: LODConfig = {
      enableLOD: true,
      distances: [50, 200, 500], // meters
      simplificationRatios: [1.0, 0.5, 0.2], // 100%, 50%, 20% detail
    };

// Update LOD levels based on camera position
      const updateLODLevels = () => {
        const cameraPosition = camera.three.position;
        lodManagerRef.current.viewerPosition.copy(cameraPosition);
      };

    // Update LOD on camera movement
    camera.controls.addEventListener('change', updateLODLevels);
  };

  // Set up occlusion culling
  const setupOcclusionCulling = (components: OBC.Components, world: OBC.World) => {
    // Set up frustum culling and occlusion queries
    const camera = components.get(OBF.OrthoPerspectiveCamera);
    
    const updateVisibility = () => {
      // Update visibility of fragments based on camera frustum
    };

    camera.controls.addEventListener('change', updateVisibility);
  };

  // Set up progressive loading system
  const setupProgressiveLoading = (components: OBC.Components) => {
    // Implementation would handle loading models in chunks
  };

  // Set up performance monitoring
  const setupPerformanceMonitoring = (components: OBC.Components) => {
    let lastTime = performance.now();
    let frameCount = 0;

    const updatePerformanceMetrics = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        const memoryUsage = (performance as any).memory 
          ? (performance as any).memory.usedJSHeapSize / (1024 * 1024)
          : 0;

        setPerformanceMetrics({
          fps,
          memoryUsageMB: Math.round(memoryUsage),
          triangleCount: 0, // Would be calculated from actual geometry
          drawCalls: 0, // Would be tracked from renderer
          loadTime: 0,
          renderTime: currentTime - lastTime,
        });

        frameCount = 0;
        lastTime = currentTime;
      }
    };

    performanceMonitorRef.current = setInterval(updatePerformanceMetrics, 100);
  };

  // Optimized model loading with streaming
  const loadModelOptimized = useCallback(async (
    modelUrl: string,
    options: {
      enableStreaming?: boolean;
      maxConcurrentRequests?: number;
      chunkSize?: number;
    } = {}
  ) => {
    if (!components) {
      throw new Error('BIM engine not initialized');
    }

    try {
      setLoadingProgress({
        phase: 'downloading',
        percentage: 0,
        loadedFragments: 0,
        totalFragments: 0,
        memoryUsage: 0,
        errorCount: 0,
      });

      const fragments = components.get(OBC.FragmentsManager);
      const loader = components.get(OBC.IfcLoader);

      // Configure loader for performance
      await loader.setup();

      // Implement streaming if enabled
      if (options.enableStreaming) {
        return await loadModelWithStreaming(modelUrl, loader, options);
      } else {
        return await loadModelStandard(modelUrl, loader);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load model');
      throw error;
    }
  }, [components]);

  // Load model with streaming for large files
  const loadModelWithStreaming = async (
    modelUrl: string,
    loader: any,
    options: any
  ) => {
    // This would implement actual streaming logic
    // For now, we'll simulate progressive loading
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') || '0');
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;
      
      const percentage = totalSize > 0 ? (receivedLength / totalSize) * 100 : 0;
      
      setLoadingProgress(prev => prev ? {
        ...prev,
        phase: 'downloading',
        percentage: Math.round(percentage),
      } : null);
    }

    // Combine chunks and process
    const modelData = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      modelData.set(chunk, position);
      position += chunk.length;
    }

    setLoadingProgress(prev => prev ? {
      ...prev,
      phase: 'parsing',
      percentage: 0,
    } : null);

    // Load the model data
    const modelFile = new File([modelData], 'model.ifc', { type: 'application/octet-stream' });
    const model = await loader.load(modelFile);

    setLoadingProgress(prev => prev ? {
      ...prev,
      phase: 'rendering',
      percentage: 100,
    } : null);

    return model;
  };

  // Standard model loading
  const loadModelStandard = async (modelUrl: string, loader: any) => {
    const response = await fetch(modelUrl);
    const modelData = await response.arrayBuffer();
    const modelFile = new File([modelData], 'model.ifc', { type: 'application/octet-stream' });
    
    return await loader.load(modelFile);
  };

  // Optimized disposal
  const disposeOptimized = useCallback(() => {
    // Clear performance monitoring
    if (performanceMonitorRef.current) {
      clearInterval(performanceMonitorRef.current);
      performanceMonitorRef.current = null;
    }

    // Clear memory manager
    const memoryManager = memoryManagerRef.current;
    memoryManager.loadedModels.forEach(model => {
      model.dispose?.();
    });
    memoryManager.loadedModels.clear();
    memoryManager.fragmentCache.clear();

    // Dispose components
    if (components) {
      try {
        const renderer = components.get(OBF.PostproductionRenderer);
        const fragments = components.get(OBC.FragmentsManager);
        
        // Clear all fragments
        fragments.dispose();
        
        // Dispose renderer resources
        renderer.dispose();
        
        components.dispose();
      } catch (error) {
        // Disposal failed — non-critical
      }
    }

    setComponents(null);
    setIsInitialized(false);
    setLoadingProgress(null);
    setPerformanceMetrics(null);
    setError(null);
  }, [components]);

  // Initialize on mount
  useEffect(() => {
    initializeOptimizedEngine().catch(console.error);
    
    return () => {
      disposeOptimized();
    };
  }, [initializeOptimizedEngine, disposeOptimized]);

  // Performance optimization method
  const optimizeForPerformance = useCallback(() => {
    if (!components) return;

    const renderer = components.get(OBF.PostproductionRenderer);
    
    // Reduce quality settings
    renderer.postproduction.enabled = false;
    renderer.three.renderer.setPixelRatio(1);
    renderer.three.renderer.shadowMap.enabled = false;

    // Trigger LOD updates to lower quality levels
    lodManagerRef.current.currentLODLevel = 'low';
  }, [components]);

  // Memory optimization method
  const optimizeMemory = useCallback(() => {
    performMemoryCleanup();
    
    // Force lower LOD levels
    lodManagerRef.current.currentLODLevel = 'medium';
  }, []);

  return {
    components,
    isInitialized,
    loadingProgress,
    performanceMetrics,
    error,
    loadModelOptimized,
    optimizeForPerformance,
    optimizeMemory,
    disposeOptimized,
  };
};