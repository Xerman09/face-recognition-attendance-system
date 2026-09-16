"use client";

import React from "react";
import { ScanStatus } from "@/types";
import { ScanFace, CheckCircle2, XCircle, ShieldAlert, Sparkles } from "lucide-react";

interface BiometricOverlayProps {
  status: ScanStatus;
  livenessVariance: number;
  message?: string;
}

export function BiometricOverlay({
  status,
  livenessVariance,
  message,
}: BiometricOverlayProps) {
  // Border colors based on status
  const getBorderColor = () => {
    switch (status) {
      case "waiting_liveness":
        return "border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.5)]";
      case "scanning":
        return "border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)]";
      case "success":
        return "border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.7)]";
      case "error":
        return "border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.7)]";
      default:
        return "border-slate-500/40";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Laser Scanning Line when matching */}
      {status === "scanning" && (
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20" />
      )}

      {/* Biometric Target Area */}
      <div className="relative w-[85%] h-[85%] max-w-sm max-h-[28rem] flex items-center justify-center">
        {/* Animated outer ring */}
        <div
          className={`absolute inset-0 rounded-[48%] border-2 transition-all duration-300 ${getBorderColor()}`}
        />

        {/* Outer Corner Targeting Brackets */}
        <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-emerald-400/80 rounded-tl-xl" />
        <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-emerald-400/80 rounded-tr-xl" />
        <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-emerald-400/80 rounded-bl-xl" />
        <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-emerald-400/80 rounded-br-xl" />

        {/* Center Reticle / Silhouette */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center text-slate-400/60">
            <ScanFace className="h-16 w-16 mb-2 stroke-[1.2]" />
            <span className="text-xs font-medium tracking-wide">
              Position Face in Frame
            </span>
          </div>
        )}

        {/* Status: Analyzing Liveness */}
        {status === "waiting_liveness" && (
          <div className="absolute -bottom-14 flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Analyzing Liveness...
            </div>
            <div className="text-[10px] text-amber-200/80 mt-1 font-mono">
              Natural micro-movement check
            </div>
          </div>
        )}

        {/* Status: Extracting & Matching */}
        {status === "scanning" && (
          <div className="absolute -bottom-14 flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Verifying Biometrics...
            </div>
            <div className="text-[10px] text-cyan-200/80 mt-1 font-mono">
              128-D Euclidean Vector Match
            </div>
          </div>
        )}

        {/* Status: Success Banner */}
        {status === "success" && (
          <div className="absolute -bottom-14 flex flex-col items-center">
            <div className="px-5 py-2 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {message || "Face Verified • Access Granted"}
            </div>
          </div>
        )}

        {/* Status: Error Banner */}
        {status === "error" && (
          <div className="absolute -bottom-14 flex flex-col items-center">
            <div className="px-5 py-2 rounded-full bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-rose-950">
              <XCircle className="h-4 w-4 text-rose-400" />
              {message || "Face Not Recognized"}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Liveness Variance Meter in corner */}
      {status === "waiting_liveness" && (
        <div className="absolute bottom-4 left-6 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-2 text-[10px] text-slate-300">
          <span>Liveness Variance:</span>
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-150"
              style={{
                width: `${Math.min(100, (livenessVariance / 0.0015) * 100)}%`,
              }}
            />
          </div>
          <span className="font-mono text-amber-400">
            {livenessVariance.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
