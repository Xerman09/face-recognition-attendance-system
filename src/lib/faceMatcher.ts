/**
 * 128-Dimensional Face Descriptor Euclidean Distance Matcher
 */

import { FaceBiometricRecord, Employee } from "../types";

export interface MatchResult {
  matched: boolean;
  userId?: number;
  distance: number;
  confidenceScore: number;
  employee?: Employee;
}

export function computeEuclideanDistance(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array
): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error(
      `Descriptor dimensions mismatch: ${descriptor1.length} vs ${descriptor2.length}`
    );
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function findBestMatch(
  liveDescriptor: number[] | Float32Array,
  enrolledBiometrics: FaceBiometricRecord[],
  employeesMap: Map<number, Employee>,
  threshold: number = 0.55
): MatchResult {
  let lowestDistance = Number.POSITIVE_INFINITY;
  let bestUserId: number | undefined;

  for (const record of enrolledBiometrics) {
    if (!record.is_active || !record.face_encoding) continue;

    try {
      const storedVector = Array.isArray(record.face_encoding)
        ? record.face_encoding
        : (JSON.parse(record.face_encoding) as number[]);

      if (storedVector.length !== 128) continue;

      const distance = computeEuclideanDistance(liveDescriptor, storedVector);

      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestUserId = record.user_id;
      }
    } catch (e) {
      console.warn("Invalid face encoding encountered in record:", record.id, e);
    }
  }

  const isMatch = lowestDistance <= threshold && bestUserId !== undefined;
  // Convert distance to human readable confidence score (0 to 100%)
  const confidenceScore = isMatch
    ? Math.max(0, Math.min(100, Math.round((1 - lowestDistance / threshold) * 40 + 60)))
    : 0;

  return {
    matched: isMatch,
    userId: isMatch ? bestUserId : undefined,
    distance: lowestDistance === Number.POSITIVE_INFINITY ? 1.0 : lowestDistance,
    confidenceScore,
    employee: isMatch && bestUserId ? employeesMap.get(bestUserId) : undefined,
  };
}
