import { BimViewer } from './BimViewer';

export function BimStandaloneTestPage() {
  const getModelBuffer = async (path: string) => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load test model from ${path}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  };

  return (
    <div className="w-screen h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-[1200px] max-h-[800px] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <BimViewer 
          storagePath="/bim/test-model.ifc" 
          modelName="Modelo de Prueba Local (Sin DB)"
          getModelBuffer={getModelBuffer}
          showElementPanel={true}
        />
      </div>
    </div>
  );
}
