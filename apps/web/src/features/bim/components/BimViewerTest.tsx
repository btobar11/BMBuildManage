/**
 * BIM Viewer Test Component - Para probar el visor 3D sin archivos IFC
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as OBC from "@thatopen/components";
import { Loader2, Cube, RotateCcw } from 'lucide-react';

export function BimViewerTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    let components: OBC.Components | null = null;
    
    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize OBC Components
        components = new OBC.Components();
        
        // Create world (scene, camera, renderer)
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.SimpleCamera,
          OBC.SimpleRenderer
        >();

        // Configure renderer
        world.scene = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(components, containerRef.current!);
        world.camera = new OBC.SimpleCamera(components);
        
        // Set renderer size
        const { clientWidth, clientHeight } = containerRef.current!;
        world.renderer.setSize(clientWidth, clientHeight);

        // Add basic lighting
        world.scene.setup();
        
        // Create a simple test cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0x6366f1 });
        const cube = new THREE.Mesh(geometry, material);
        world.scene.three.add(cube);

        // Position camera
        world.camera.three.position.set(5, 5, 5);
        world.camera.three.lookAt(0, 0, 0);

        // Add controls
        await world.camera.controls.setLookAt(5, 5, 5, 0, 0, 0);

        // Start render loop
        const animate = () => {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
          requestAnimationFrame(animate);
        };
        animate();

        setIsInitialized(true);
        setIsLoading(false);

        console.log('✅ BIM Viewer Test initialized successfully');
        
      } catch (err: any) {
        console.error('❌ BIM Viewer initialization failed:', err);
        setError(err.message || 'Error initializing BIM viewer');
        setIsLoading(false);
      }
    };

    initViewer();

    // Cleanup
    return () => {
      if (components) {
        components.dispose();
      }
    };
  }, [isInitialized]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && isInitialized) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Trigger resize if needed
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized]);

  const handleReset = () => {
    setIsInitialized(false);
    setError(null);
  };

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
            <p className="text-sm">Inicializando motor BIM...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
          <div className="text-center text-white p-6">
            <div className="text-red-400 mb-3">
              <Cube size={48} />
            </div>
            <h3 className="text-lg font-medium mb-2">Error del Motor BIM</h3>
            <p className="text-sm text-red-200 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Success Indicator */}
      {!isLoading && !error && isInitialized && (
        <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
          ✅ Motor BIM activo
        </div>
      )}

      {/* Info */}
      {!isLoading && !error && isInitialized && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white px-3 py-2 rounded-lg text-xs">
          <p>🎯 Three.js + ThatOpen Components</p>
          <p>📦 Cubo de prueba giratorio</p>
        </div>
      )}
    </div>
  );
}