/**
 * Clash Detection Web Worker
 * 
 * Performs geometric collision detection between BIM models
 * using spatial indexing and bounding box intersection algorithms.
 * 
 * Runs in separate thread to prevent UI blocking during heavy computations.
 */

// Spatial indexing using R-tree like structure
class SpatialIndex {
  constructor() {
    this.elements = [];
  }

  insert(element) {
    this.elements.push({
      id: element.id,
      guid: element.guid,
      expressID: element.expressID,
      modelId: element.modelId,
      discipline: element.discipline,
      name: element.name,
      bbox: element.bbox,
      center: {
        x: (element.bbox.min.x + element.bbox.max.x) / 2,
        y: (element.bbox.min.y + element.bbox.max.y) / 2,
        z: (element.bbox.min.z + element.bbox.max.z) / 2,
      }
    });
  }

  query(bbox) {
    return this.elements.filter(element => 
      this.boxesIntersect(element.bbox, bbox)
    );
  }

  boxesIntersect(box1, box2) {
    return !(
      box1.max.x < box2.min.x || box2.max.x < box1.min.x ||
      box1.max.y < box2.min.y || box2.max.y < box1.min.y ||
      box1.max.z < box2.min.z || box2.max.z < box1.min.z
    );
  }
}

// Clash detection algorithms
class ClashDetector {
  constructor(tolerance = 10) {
    this.tolerance = tolerance; // mm
    this.spatialIndex = new SpatialIndex();
    this.processedPairs = new Set();
  }

  addModel(modelData) {
    modelData.elements.forEach(element => {
      this.spatialIndex.insert(element);
    });
  }

  detectClashes(modelA, modelB) {
    const clashes = [];
    
    modelA.elements.forEach(elementA => {
      // Expand bounding box by tolerance
      const expandedBbox = this.expandBoundingBox(elementA.bbox, this.tolerance);
      
      // Query spatial index for potential intersections
      const candidates = this.spatialIndex.query(expandedBbox);
      
      candidates.forEach(elementB => {
        // Skip same model comparisons
        if (elementA.modelId === elementB.modelId) return;
        
        // Skip if not from modelB
        if (elementB.modelId !== modelB.id) return;
        
        // Create unique pair identifier
        const pairId = `${elementA.guid}-${elementB.guid}`;
        const reversePairId = `${elementB.guid}-${elementA.guid}`;
        
        // Skip if already processed
        if (this.processedPairs.has(pairId) || this.processedPairs.has(reversePairId)) {
          return;
        }
        
        this.processedPairs.add(pairId);
        
        // Perform detailed geometric intersection
        const clash = this.calculateClash(elementA, elementB);
        if (clash) {
          clashes.push(clash);
        }
      });
    });
    
    return clashes;
  }

  expandBoundingBox(bbox, tolerance) {
    const toleranceM = tolerance / 1000; // Convert mm to meters
    return {
      min: {
        x: bbox.min.x - toleranceM,
        y: bbox.min.y - toleranceM,
        z: bbox.min.z - toleranceM,
      },
      max: {
        x: bbox.max.x + toleranceM,
        y: bbox.max.y + toleranceM,
        z: bbox.max.z + toleranceM,
      }
    };
  }

  calculateClash(elementA, elementB) {
    const intersection = this.calculateIntersection(elementA.bbox, elementB.bbox);
    
    if (!intersection || intersection.volume <= 0) {
      return null;
    }

    const severity = this.calculateSeverity(intersection.volume);
    const clashType = this.determineClashType(elementA, elementB, intersection);

    return {
      elementA: {
        modelId: elementA.modelId,
        discipline: elementA.discipline,
        guid: elementA.guid,
        expressID: elementA.expressID,
        name: elementA.name,
      },
      elementB: {
        modelId: elementB.modelId,
        discipline: elementB.discipline,
        guid: elementB.guid,
        expressID: elementB.expressID,
        name: elementB.name,
      },
      clashType,
      severity,
      intersectionVolume: intersection.volume,
      center: intersection.center,
    };
  }

  calculateIntersection(boxA, boxB) {
    const minX = Math.max(boxA.min.x, boxB.min.x);
    const minY = Math.max(boxA.min.y, boxB.min.y);
    const minZ = Math.max(boxA.min.z, boxB.min.z);
    const maxX = Math.min(boxA.max.x, boxB.max.x);
    const maxY = Math.min(boxA.max.y, boxB.max.y);
    const maxZ = Math.min(boxA.max.z, boxB.max.z);

    if (minX >= maxX || minY >= maxY || minZ >= maxZ) {
      return null; // No intersection
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;
    const volume = width * height * depth;

    return {
      volume,
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2,
      },
      dimensions: { width, height, depth }
    };
  }

  calculateSeverity(volume) {
    // Volume in cubic meters, convert to cubic centimeters for easier thresholds
    const volumeCm3 = volume * 1000000;
    
    if (volumeCm3 > 1000) return 'critical';  // > 1000 cm³
    if (volumeCm3 > 100) return 'high';       // > 100 cm³
    if (volumeCm3 > 10) return 'medium';      // > 10 cm³
    return 'low';                             // <= 10 cm³
  }

  determineClashType(elementA, elementB, intersection) {
    // Determine clash type based on disciplines and intersection characteristics
    const disciplineA = elementA.discipline;
    const disciplineB = elementB.discipline;
    
    // Hard clashes: Physical elements that can't occupy same space
    if ((disciplineA === 'structure' && disciplineB === 'structure') ||
        (disciplineA === 'architecture' && disciplineB === 'structure') ||
        (disciplineA === 'structure' && disciplineB === 'architecture')) {
      return 'hard';
    }
    
    // Soft clashes: Services through structural elements (may be intentional)
    if ((disciplineA.startsWith('mep_') && disciplineB === 'structure') ||
        (disciplineA === 'structure' && disciplineB.startsWith('mep_'))) {
      return 'soft';
    }
    
    // Clearance clashes: Services too close to each other
    if (disciplineA.startsWith('mep_') && disciplineB.startsWith('mep_')) {
      return 'clearance';
    }
    
    return 'hard'; // Default to hard clash
  }

  reset() {
    this.spatialIndex = new SpatialIndex();
    this.processedPairs.clear();
  }
}

// Main worker message handler
let clashDetector = null;

self.onmessage = function(event) {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'DETECT_CLASHES':
        handleClashDetection(payload);
        break;
      
      case 'UPDATE_TOLERANCE':
        if (clashDetector) {
          clashDetector.tolerance = payload.tolerance;
        }
        break;
      
      case 'RESET':
        clashDetector = null;
        self.postMessage({ type: 'RESET_COMPLETE' });
        break;
      
      default:
        self.postMessage({
          type: 'ERROR',
          payload: { error: `Unknown message type: ${type}` }
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'CLASH_DETECTION_ERROR',
      payload: { error: error.message, stack: error.stack }
    });
  }
};

function handleClashDetection(payload) {
  const { models, tolerance, timestamp } = payload;
  
  // Initialize or reset clash detector
  clashDetector = new ClashDetector(tolerance);
  
  // Add all models to spatial index
  models.forEach(model => {
    clashDetector.addModel(model);
  });
  
  const allClashes = [];
  const totalComparisons = models.length * (models.length - 1) / 2;
  let completedComparisons = 0;
  
  // Compare each pair of models
  for (let i = 0; i < models.length; i++) {
    for (let j = i + 1; j < models.length; j++) {
      const modelA = models[i];
      const modelB = models[j];
      
      // Detect clashes between the two models
      const clashes = clashDetector.detectClashes(modelA, modelB);
      allClashes.push(...clashes);
      
      completedComparisons++;
      
      // Send progress update
      self.postMessage({
        type: 'CLASH_DETECTION_PROGRESS',
        payload: {
          progress: (completedComparisons / totalComparisons) * 100,
          completedComparisons,
          totalComparisons,
          timestamp
        }
      });
    }
  }
  
  // Send final results
  self.postMessage({
    type: 'CLASHES_DETECTED',
    payload: {
      clashes: allClashes,
      totalClashes: allClashes.length,
      timestamp,
      stats: {
        hard: allClashes.filter(c => c.clashType === 'hard').length,
        soft: allClashes.filter(c => c.clashType === 'soft').length,
        clearance: allClashes.filter(c => c.clashType === 'clearance').length,
        critical: allClashes.filter(c => c.severity === 'critical').length,
        high: allClashes.filter(c => c.severity === 'high').length,
        medium: allClashes.filter(c => c.severity === 'medium').length,
        low: allClashes.filter(c => c.severity === 'low').length,
      }
    }
  });
}

// Log worker initialization
console.log('[ClashDetectionWorker] Initialized and ready for clash detection tasks');