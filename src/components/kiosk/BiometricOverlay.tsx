"use client";

import React from "react";
import { ScanStatus } from "@/types";
import { ScanFace, CheckCircle2, XCircle } from "lucide-react";

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
        return "border-amber-400";
      case "scanning":
        return "border-cyan-400";
      case "success":
        return "border-emerald-400";
      case "error":
        return "border-rose-500";
      default:
        return "border-slate-700/60";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Biometric Target Area */}
      <div className="relative w-[75%] h-[80%] max-w-xs max-h-[24rem] flex items-center justify-center">
        {/* Frame boundary */}
        <div
          className={`absolute inset-0 rounded-2xl border transition-colors duration-200 ${getBorderColor()}`}
        />

        {/* Precise corner reticle ticks */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-slate-300" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-slate-300" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-slate-300" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-slate-300" />

        {/* Center Reticle / Silhouette */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <ScanFace className="h-12 w-12 mb-2 stroke-[1.2] opacity-60" />
            <span className="text-[11px] font-medium tracking-normal text-slate-400">
              Align Face
            </span>
          </div>
        )}

        {/* Status: Analyzing Liveness */}
        {status === "waiting_liveness" && (
          <div className="absolute -bottom-12 flex flex-col items-center">
            <div className="px-3 py-1 rounded-md bg-slate-900 border border-amber-500/50 text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Verifying Liveness...
            </div>
          </div>
        )}

        {/* Status: Extracting & Matching */}
        {status === "scanning" && (
          <div className="absolute -bottom-12 flex flex-col items-center">
            <div className="px-3 py-1 rounded-md bg-slate-900 border border-cyan-500/50 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Matching Face...
            </div>
          </div>
        )}

        {/* Status: Success Banner */}
        {status === "success" && (
          <div className="absolute -bottom-12 flex flex-col items-center">
            <div className="px-3.5 py-1.5 rounded-md bg-slate-900 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {message || "Face Verified"}
            </div>
          </div>
        )}

        {/* Status: Error Banner */}
        {status === "error" && (
          <div className="absolute -bottom-12 flex flex-col items-center">
            <div className="px-3.5 py-1.5 rounded-md bg-slate-900 border border-rose-500 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-400" />
              {message || "Face Not Recognized"}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Liveness Variance Meter in corner */}
      {status === "waiting_liveness" && (
        <div className="absolute bottom-3 left-4 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
          <span>Variance:</span>
          <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400"
              style={{
                width: `${Math.min(100, (livenessVariance / 0.0015) * 100)}%`,
              }}
            />
          </div>
          <span className="font-mono text-amber-400 text-[10px]">
            {livenessVariance.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
