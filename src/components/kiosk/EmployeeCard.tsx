"use client";

import React from "react";
import { Employee, ScanMode } from "@/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  BadgeCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface EmployeeCardProps {
  success: boolean;
  employee?: Employee;
  confidenceScore?: number;
  message: string;
  scanMode: ScanMode;
  onReset: () => void;
}

export function EmployeeCard({
  success,
  employee,
  confidenceScore,
  message,
  scanMode,
  onReset,
}: EmployeeCardProps) {
  const getBadgeText = () => {
    if (!success) return "Access Denied";
    if (scanMode === "CLOCK_IN") return "Clocked In Successfully";
    if (scanMode === "CLOCK_OUT") return "Clocked Out Successfully";
    return "Identity Verified";
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 bg-slate-950/80 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl p-2 sm:p-4">
      {/* Result Status Banner */}
      <div
        className={`w-full p-4 rounded-2xl flex items-center justify-between border ${
          success
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
            : "bg-rose-950/40 border-rose-500/30 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {success ? (
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-rose-400" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold leading-tight">{getBadgeText()}</div>
            <div className="text-xs opacity-80">{message}</div>
          </div>
        </div>

        {success && confidenceScore !== undefined && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Confidence
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {confidenceScore}%
            </div>
          </div>
        )}
      </div>

      {/* Employee Profile Card (when matched) */}
      {success && employee && (
        <div className="w-full mt-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Profile Picture */}
          <div className="relative mb-3">
            <div className="h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-emerald-500/30 shadow-lg bg-slate-800 flex items-center justify-center">
              {employee.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.avatarUrl}
                  alt={employee.firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-2xl font-bold text-emerald-400">
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
              <BadgeCheck className="h-4 w-4" />
            </div>
          </div>

          {/* Name & Title */}
          <h3 className="text-xl font-bold text-white tracking-tight">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">
            {employee.position || "Staff Member"}
          </p>

          {/* Metadata Grid */}
          <div className="w-full mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Building className="h-3 w-3" />
                Department
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                {employee.department || "Corporate"}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Punch Time
              </div>
              <div className="text-xs font-semibold font-mono text-emerald-300 mt-0.5">
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <div className="w-full mt-3 py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {employee.employeeNumber || `EMP-${employee.id}`}
          </div>
        </div>
      )}

      {/* Manual Reset Button */}
      <div className="w-full mt-4 flex items-center gap-2">
        <button
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          Reset Terminal Now
        </button>
      </div>
    </div>
  );
}
