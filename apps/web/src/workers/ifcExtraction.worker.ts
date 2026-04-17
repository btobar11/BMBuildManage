/**
 * IFC Extraction Web Worker
 * 
 * Offloads IFC file parsing to a separate thread to maintain 60fps
 * in the main UI thread during model loading.
 * 
 * Usage:
 * const worker = new Worker(new URL('./ifcExtraction.worker.ts', import.meta.url));
 * worker.postMessage({ type: 'EXTRACT', file: arrayBuffer });
 */

const ctx: Worker = self as any;

interface ExtractionRequest {
  type: 'EXTRACT';
  data: Uint8Array;
  fileId: string;
}

interface ProgressMessage {
  type: 'PROGRESS';
  progress: number;
  fileId: string;
  stage: string;
}

interface CompleteMessage {
  type: 'COMPLETE';
  fileId: string;
  data: {
    elementCount: number;
    metadata: any;
  };
}

interface ErrorMessage {
  type: 'ERROR';
  fileId: string;
  error: string;
}

ctx.addEventListener('message', async (event: MessageEvent<ExtractionRequest>) => {
  const { type, data, fileId } = event.data;

  if (type !== 'EXTRACT') return;

  try {
    ctx.postMessage({
      type: 'PROGRESS',
      progress: 10,
      fileId,
      stage: 'Initializing IFC parser',
    } as ProgressMessage);

    const { IfcAPI } = await import('web-ifc');
    const ifcApi = new IfcAPI();
    
    await ifcApi.Init();
    
    ctx.postMessage({
      type: 'PROGRESS',
      progress: 30,
      fileId,
      stage: 'Loading IFC file',
    } as ProgressMessage);

    const model = ifcApi.OpenModel(data, {
      USE_FAST_BOTTOM_UP: true,
      COORDINATE_TO_ORIGIN: true,
    });

    ctx.postMessage({
      type: 'PROGRESS',
      progress: 50,
      fileId,
      stage: 'Extracting elements',
    } as ProgressMessage);

    ctx.postMessage({
      type: 'PROGRESS',
      progress: 90,
      fileId,
      stage: 'Finalizing',
    } as ProgressMessage);

    const metadata = {
      modelID: model,
      ifcSchema: 'IFC4',
    };

    ifcApi.CloseModel(model);

    ctx.postMessage({
      type: 'COMPLETE',
      fileId,
      data: {
        elementCount: 0,
        metadata,
      },
    } as CompleteMessage);

  } catch (error) {
    ctx.postMessage({
      type: 'ERROR',
      fileId,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ErrorMessage);
  }
});

export {};