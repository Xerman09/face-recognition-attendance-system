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
    <div className="w-full flex flex-col items-center bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-3 sm:p-4">
      {/* Result Status Banner */}
      <div
        className={`w-full p-3 rounded-lg flex items-center justify-between border ${
          success
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/20 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {success ? (
            <div className="h-7 w-7 rounded-md bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-md bg-rose-500/20 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-rose-400" />
            </div>
          )}
          <div>
            <div className="text-xs font-semibold leading-tight">{getBadgeText()}</div>
            <div className="text-[11px] opacity-80 mt-0.5">{message}</div>
          </div>
        </div>

        {success && confidenceScore !== undefined && (
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Confidence
            </div>
            <div className="text-xs font-semibold font-mono text-emerald-400">
              {confidenceScore}%
            </div>
          </div>
        )}
      </div>

      {/* Employee Profile Card (when matched) */}
      {success && employee && (
        <div className="w-full mt-3 p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
          {/* Profile Picture */}
          <div className="relative mb-2.5">
            <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
              {employee.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.avatarUrl}
                  alt={employee.firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-lg font-bold text-emerald-400">
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center">
              <BadgeCheck className="h-3 w-3" />
            </div>
          </div>

          {/* Name & Title */}
          <h3 className="text-base font-semibold text-slate-100">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {employee.position || "Staff Member"}
          </p>

          {/* Metadata Grid */}
          <div className="w-full mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-left">
            <div className="p-2 rounded-md bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Building className="h-3 w-3" />
                Department
              </div>
              <div className="text-xs font-medium text-slate-200 truncate mt-0.5">
                {employee.department || "Corporate"}
              </div>
            </div>

            <div className="p-2 rounded-md bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </div>
              <div className="text-xs font-medium font-mono text-emerald-400 mt-0.5">
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <div className="w-full mt-2.5 py-1 px-2.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-mono font-medium flex items-center justify-center gap-1.5">
            <span>ID: {employee.employeeNumber || `EMP-${employee.id}`}</span>
          </div>
        </div>
      )}

      {/* Manual Reset Button */}
      <div className="w-full mt-3 flex items-center gap-2">
        <button
          onClick={onReset}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          Done / Next Person
        </button>
      </div>
    </div>
  );
}
