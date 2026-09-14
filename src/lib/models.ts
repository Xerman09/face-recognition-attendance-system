/**
 * Face-API.js Neural Network Model Manager
 * Ensures robust, non-blocking model loading with fallback support.
 */

import * as faceapi from "face-api.js";

let loadingPromise: Promise<boolean> | null = null;

export interface ModelsStatus {
  ssdMobilenetv1: boolean;
  tinyFaceDetector: boolean;
  faceLandmark68Net: boolean;
  faceLandmark68TinyNet: boolean;
  faceRecognitionNet: boolean;
  isReady: boolean;
}

export function checkModelsStatus(): ModelsStatus {
  const ssd = !!faceapi.nets.ssdMobilenetv1?.params;
  const tiny = !!faceapi.nets.tinyFaceDetector?.params;
  const landmarks = !!faceapi.nets.faceLandmark68Net?.params;
  const tinyLandmarks = !!faceapi.nets.faceLandmark68TinyNet?.params;
  const recognition = !!faceapi.nets.faceRecognitionNet?.params;

  const isReady = (ssd || tiny) && (landmarks || tinyLandmarks) && recognition;

  return {
    ssdMobilenetv1: ssd,
    tinyFaceDetector: tiny,
    faceLandmark68Net: landmarks,
    faceLandmark68TinyNet: tinyLandmarks,
    faceRecognitionNet: recognition,
    isReady,
  };
}

export async function loadModels(modelUri: string = "/models"): Promise<ModelsStatus> {
  if (typeof window === "undefined") {
    return checkModelsStatus();
  }

  if (loadingPromise) {
    await loadingPromise;
    return checkModelsStatus();
  }

  loadingPromise = (async () => {
    const loadSafely = async (name: string, fn: () => Promise<void>) => {
      try {
        await fn();
        return true;
      } catch (err) {
        console.warn(`[Biometrics] Warning: Failed to load ${name}:`, err);
        return false;
      }
    };

    // Load models in parallel safely without letting one failure reject the others
    await Promise.allSettled([
      loadSafely("tinyFaceDetector", () => faceapi.nets.tinyFaceDetector.loadFromUri(modelUri)),
      loadSafely("faceLandmark68Net", () => faceapi.nets.faceLandmark68Net.loadFromUri(modelUri)),
      loadSafely("faceLandmark68TinyNet", () => faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUri)),
      loadSafely("faceRecognitionNet", () => faceapi.nets.faceRecognitionNet.loadFromUri(modelUri)),
      loadSafely("ssdMobilenetv1", () => faceapi.nets.ssdMobilenetv1.loadFromUri(modelUri)),
    ]);

    return true;
  })();

  await loadingPromise;
  return checkModelsStatus();
}
