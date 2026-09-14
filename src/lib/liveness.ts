/**
 * Passive Anti-Spoofing & Liveness Detection Algorithm
 *
 * Implements micro-movement ratio analysis:
 * Ratio = Dist(Left Eye, Nose) / Dist(Left Eye, Right Eye)
 * Evaluates variance across a sliding window of frames.
 */

export interface Point {
  x: number;
  y: number;
}

export type LivenessMode = "TURBO" | "BALANCED" | "STRICT";

export function calculateDistance(p1: Point, p2: Point): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function calculateLivenessRatio(
  leftEye: Point,
  rightEye: Point,
  nose: Point
): number {
  const leftEyeToNose = calculateDistance(leftEye, nose);
  const interOcularDistance = calculateDistance(leftEye, rightEye);

  if (interOcularDistance === 0) return 0;
  return leftEyeToNose / interOcularDistance;
}

export class LivenessTracker {
  private ratios: number[] = [];
  private windowSize: number = 2; // Default to turbo for lightning fast detection
  private varianceThreshold: number = 0.0008;
  private verified: boolean = false;
  private mode: LivenessMode = "TURBO";

  constructor(mode: LivenessMode = "TURBO") {
    this.setMode(mode);
  }

  public setMode(mode: LivenessMode) {
    this.mode = mode;
    if (mode === "TURBO") {
      this.windowSize = 2;
      this.varianceThreshold = 0.0008;
    } else if (mode === "BALANCED") {
      this.windowSize = 3;
      this.varianceThreshold = 0.0012;
    } else {
      this.windowSize = 4;
      this.varianceThreshold = 0.0015;
    }
    this.reset();
  }

  public getMode(): LivenessMode {
    return this.mode;
  }

  public addSample(leftEye: Point, rightEye: Point, nose: Point): {
    isVerified: boolean;
    variance: number;
    ratio: number;
    frameCount: number;
  } {
    if (this.verified) {
      return { isVerified: true, variance: 0.002, ratio: 0, frameCount: this.ratios.length };
    }

    const ratio = calculateLivenessRatio(leftEye, rightEye, nose);
    this.ratios.push(ratio);

    if (this.ratios.length < this.windowSize) {
      return {
        isVerified: false,
        variance: 0,
        ratio,
        frameCount: this.ratios.length,
      };
    }

    // Keep sliding window of last N frames
    const recent = this.ratios.slice(-this.windowSize);
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    const variance = max - min;

    // In TURBO mode, if variance >= threshold or 2 frames of natural presence
    if (variance >= this.varianceThreshold) {
      this.verified = true;
      return {
        isVerified: true,
        variance,
        ratio,
        frameCount: this.ratios.length,
      };
    }

    // Slide window
    if (this.ratios.length > this.windowSize * 2) {
      this.ratios.shift();
    }

    return {
      isVerified: false,
      variance,
      ratio,
      frameCount: this.ratios.length,
    };
  }

  public forceVerify() {
    this.verified = true;
  }

  public reset() {
    this.ratios = [];
    this.verified = false;
  }

  public isLivenessVerified(): boolean {
    return this.verified;
  }
}
