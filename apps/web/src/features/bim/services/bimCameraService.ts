/**
 * BimCameraService — Camera Controls for Clash Visualization
 * 
 * Provides camera focus and isolation functionality for BIM clashes.
 * Allows zooming to specific elements and isolating conflicting pairs.
 */
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import type { BimElementDB } from '../types-bim5d';

interface CameraAnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
}

const DEFAULT_DURATION = 800;
const EASING_FUNCTIONS = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

export class BimCameraService {
  private camera: any;
  private controls: any;

  constructor(components: OBC.Components) {
    const worlds = components.get(OBC.Worlds);
    const world = worlds.list.values().next().value;
    
    if (!world) {
      throw new Error('No world found in components');
    }

    this.camera = world.camera;
    this.controls = world.camera.controls;
  }

  async focusOnElement(
    element: BimElementDB,
    options: CameraAnimationOptions = {}
  ): Promise<void> {
    const duration = options.duration || DEFAULT_DURATION;
    const easing = options.easing || EASING_FUNCTIONS.easeOutCubic;

    const target = this.getBoundingBoxCenter(element.bounding_box);
    const zoom = this.calculateZoom(element.bounding_box);

    await this.animateCamera(target, zoom, duration, easing);
  }

  async focusOnClash(
    elementA: BimElementDB,
    elementB: BimElementDB,
    options: CameraAnimationOptions = {}
  ): Promise<void> {
    const duration = options.duration || DEFAULT_DURATION;
    const easing = options.easing || EASING_FUNCTIONS.easeOutCubic;

    const centerA = this.getBoundingBoxCenter(elementA.bounding_box);
    const centerB = this.getBoundingBoxCenter(elementB.bounding_box);

    const center = new THREE.Vector3().addVectors(centerA, centerB).multiplyScalar(0.5);
    const combinedBounds = this.getCombinedBoundingBox(elementA.bounding_box, elementB.bounding_box);
    const zoom = this.calculateZoom(combinedBounds);

    await this.animateCamera(center, zoom, duration, easing);
  }

  async focusOnClashGuids(
    guidA: string,
    guidB: string,
    getBoundingBox: (guid: string) => { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null
  ): Promise<void> {
    const boxA = getBoundingBox(guidA);
    const boxB = getBoundingBox(guidB);

if (!boxA && !boxB) {
      return;
    }

    if (!boxA || !boxB) {
      const box = boxA || boxB!;
      await this.focusOnBoundingBox(box);
      return;
    }

    const centerA = this.getBoundingBoxCenter(boxA);
    const centerB = this.getBoundingBoxCenter(boxB);
    const center = new THREE.Vector3().addVectors(centerA, centerB).multiplyScalar(0.5);
    const combinedBounds = this.getCombinedBoundingBox(boxA, boxB);
    const zoom = this.calculateZoom(combinedBounds);

    await this.animateCamera(center, zoom, DEFAULT_DURATION, EASING_FUNCTIONS.easeOutCubic);
  }

  private async focusOnBoundingBox(
    box: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number },
    options: CameraAnimationOptions = {}
  ): Promise<void> {
    const duration = options.duration || DEFAULT_DURATION;
    const easing = options.easing || EASING_FUNCTIONS.easeOutCubic;

    const center = this.getBoundingBoxCenter(box);
    const zoom = this.calculateZoom(box);

    await this.animateCamera(center, zoom, duration, easing);
  }

  private getBoundingBoxCenter(
    box: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null
  ): THREE.Vector3 {
    if (!box) {
      return new THREE.Vector3(0, 5, 0);
    }

    return new THREE.Vector3(
      (box.minX + box.maxX) / 2,
      (box.minY + box.maxY) / 2,
      (box.minZ + box.maxZ) / 2
    );
  }

  private getCombinedBoundingBox(
    boxA: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null,
    boxB: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null
  ): { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } {
    if (!boxA) return boxB || { minX: -10, minY: 0, maxX: 10, maxY: 10, minZ: -10, maxZ: 10 };
    if (!boxB) return boxA;

    return {
      minX: Math.min(boxA.minX, boxB.minX),
      minY: Math.min(boxA.minY, boxB.minY),
      minZ: Math.min(boxA.minZ, boxB.minZ),
      maxX: Math.max(boxA.maxX, boxB.maxX),
      maxY: Math.max(boxA.maxY, boxB.maxY),
      maxZ: Math.max(boxA.maxZ, boxB.maxZ),
    };
  }

  private calculateZoom(
    box: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null
  ): number {
    if (!box) return 20;

    const size = new THREE.Vector3(
      box.maxX - box.minX,
      box.maxY - box.minY,
      box.maxZ - box.minZ
    );
    const maxDim = Math.max(size.x, size.y, size.z);

    return Math.max(maxDim * 2, 10);
  }

  private async animateCamera(
    target: THREE.Vector3,
    zoom: number,
    duration: number,
    easing: (t: number) => number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.controls) {
        resolve();
        return;
      }

      const startTarget = new THREE.Vector3();
      const startPosition = new THREE.Vector3();
      
      this.controls.getTarget(startTarget);
      this.camera.three.getWorldPosition(startPosition);

      const offset = new THREE.Vector3(
        zoom * 0.5,
        zoom * 0.5,
        zoom * 0.5
      );
      const endPosition = target.clone().add(offset);

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        const currentTarget = new THREE.Vector3().lerpVectors(startTarget, target, easedProgress);
        const currentPosition = new THREE.Vector3().lerpVectors(startPosition, endPosition, easedProgress);

        this.controls.setLookAt(
          currentPosition.x, currentPosition.y, currentPosition.z,
          currentTarget.x, currentTarget.y, currentTarget.z,
          false
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  resetView(): void {
    if (this.controls) {
      this.controls.setLookAt(30, 20, 30, 0, 5, 0, false);
    }
  }

  zoomIn(): void {
    if (this.controls) {
      const target = new THREE.Vector3();
      const position = new THREE.Vector3();
      this.controls.getTarget(target);
      this.camera.three.getWorldPosition(position);

      const direction = target.clone().sub(position).normalize();
      const newPosition = position.add(direction.multiplyScalar(5));

      this.controls.setLookAt(
        newPosition.x, newPosition.y, newPosition.z,
        target.x, target.y, target.z,
        false
      );
    }
  }

  zoomOut(): void {
    if (this.controls) {
      const target = new THREE.Vector3();
      const position = new THREE.Vector3();
      this.controls.getTarget(target);
      this.camera.three.getWorldPosition(position);

      const direction = target.clone().sub(position).normalize();
      const newPosition = position.sub(direction.multiplyScalar(5));

      this.controls.setLookAt(
        newPosition.x, newPosition.y, newPosition.z,
        target.x, target.y, target.z,
        false
      );
    }
  }
}

export function useBimCameraFocus(components: OBC.Components | null) {
  const serviceRef = React.useRef<BimCameraService | null>(null);

  React.useEffect(() => {
    if (components && !serviceRef.current) {
      serviceRef.current = new BimCameraService(components);
    }

    return () => {
      serviceRef.current = null;
    };
  }, [components]);

  return serviceRef.current;
}

import React from 'react';
