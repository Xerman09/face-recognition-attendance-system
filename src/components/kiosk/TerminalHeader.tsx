"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Radio,
  Users,
  History,
  ScanFace,
  Sparkles,
} from "lucide-react";
import { soundFx } from "@/lib/audio";
import { ScanMode } from "@/types";

interface TerminalHeaderProps {
  modelsLoaded: boolean;
  activeTab: "kiosk" | "logs" | "directory";
  onTabChange: (tab: "kiosk" | "logs" | "directory") => void;
  isStreaming: boolean;
}

export function TerminalHeader({
  modelsLoaded,
  activeTab,
  onTabChange,
  isStreaming,
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
    <header className="w-full glass-panel border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Status Pill */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ScanFace className="h-5 w-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  UniHR Biometrics
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0 Kiosk
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Face Recognition Attendance Terminal
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <Radio
              className={`h-3 w-3 ${
                isStreaming
                  ? "text-emerald-400 animate-ping"
                  : "text-slate-500"
              }`}
            />
            <span className="text-slate-300">
              {modelsLoaded
                ? isStreaming
                  ? "Camera Online"
                  : "AI Ready"
                : "Loading Models..."}
            </span>
          </div>
        </div>


        {/* Right: Clock & Utility Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Real-time Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
            <Clock className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-xs font-mono font-bold text-slate-100 leading-none">
                {timeStr || "--:--:--"}
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                {dateStr || "Loading..."}
              </div>
            </div>
          </div>

          {/* Sound & Fullscreen controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Kiosk"}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-slate-300" />
              ) : (
                <Maximize2 className="h-4 w-4 text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
