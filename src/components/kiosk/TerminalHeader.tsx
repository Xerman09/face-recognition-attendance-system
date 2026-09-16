"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ScanFace,
  ArrowLeft,
} from "lucide-react";
import { soundFx } from "@/lib/audio";

interface TerminalHeaderProps {
  modelsLoaded: boolean;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  isStreaming: boolean;
  activeEntityName?: string;
  onSwitchEntity?: () => void;
}

export function TerminalHeader({
  modelsLoaded,
  isStreaming,
  activeEntityName,
  onSwitchEntity,
}: TerminalHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {onSwitchEntity && (
              <button
                onClick={onSwitchEntity}
                title="Back to Database Selection"
                className="p-1.5 -ml-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ScanFace className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">
                  {activeEntityName || process.env.NEXT_PUBLIC_COMPANY_NAME || "UniHR Biometrics"}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                  Terminal
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isStreaming ? "bg-emerald-400" : modelsLoaded ? "bg-amber-400" : "bg-slate-600"
              }`}
            />
            <span className="text-[11px] font-medium">
              {modelsLoaded ? (isStreaming ? "Active" : "Ready") : "Initializing..."}
            </span>
          </div>
        </div>

        {/* Right: Clock & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Clock */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <div className="text-right">
              <div className="text-xs font-mono font-medium text-slate-200 leading-none">
                {timeStr || "--:--:--"}
              </div>
              <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                {dateStr || "Loading..."}
              </div>
            </div>
          </div>

          {/* Sound & Fullscreen controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
              className="p-1.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5 text-rose-400" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-slate-300" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Kiosk"}
              className="p-1.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5 text-slate-300" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
