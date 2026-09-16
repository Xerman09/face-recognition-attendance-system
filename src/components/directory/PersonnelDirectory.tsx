"use client";

import React, { useState } from "react";
import { Employee } from "@/types";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ScanFace,
  Building,
  Mail,
  UserPlus,
} from "lucide-react";

interface PersonnelDirectoryProps {
  employees: Employee[];
  onOpenEnrollment: () => void;
}

export function PersonnelDirectory({
  employees,
  onOpenEnrollment,
}: PersonnelDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEnrolled, setFilterEnrolled] = useState<"ALL" | "ENROLLED" | "PENDING">("ALL");

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterEnrolled === "ENROLLED") return emp.isEnrolled;
    if (filterEnrolled === "PENDING") return !emp.isEnrolled;
    return true;
  });

  const enrolledCount = employees.filter((e) => e.isEnrolled).length;
  const pendingCount = employees.length - enrolledCount;
  const enrollmentRate = employees.length
    ? Math.round((enrolledCount / employees.length) * 100)
    : 0;

  return (
    <div className="w-full space-y-5">
      {/* Stats Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-[2rem] border border-slate-800/80 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="relative z-10">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Personnel</div>
            <div className="text-3xl font-bold text-white mt-1">{employees.length}</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 relative z-10 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-slate-800/20 rounded-full blur-2xl group-hover:bg-slate-700/30 transition-colors"></div>
        </div>

        <div className="glass-panel p-6 rounded-[2rem] border border-slate-800/80 flex items-center justify-between shadow-lg shadow-emerald-900/10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Biometrics Enrolled</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{enrolledCount}</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform glow-emerald">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
        </div>

        <div className="glass-panel p-6 rounded-[2rem] border border-slate-800/80 flex items-center justify-between shadow-lg shadow-cyan-900/10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Enrollment Rate</div>
            <div className="text-3xl font-bold text-cyan-400 mt-1">{enrollmentRate}%</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform glow-cyan">
            <ScanFace className="h-6 w-6" />
          </div>
          <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterEnrolled("ALL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterEnrolled === "ALL"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({employees.length})
          </button>
          <button
            onClick={() => setFilterEnrolled("ENROLLED")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterEnrolled === "ENROLLED"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Enrolled ({enrolledCount})
          </button>
          <button
            onClick={() => setFilterEnrolled("PENDING")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterEnrolled === "PENDING"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500/70" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>

          <button
            onClick={onOpenEnrollment}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-[0.98] whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            Enroll Face
          </button>
        </div>
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="glass-panel p-5 rounded-3xl border border-slate-800/80 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group hover:shadow-xl hover:shadow-emerald-900/10 relative overflow-hidden bg-slate-950/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-emerald-500/50 flex items-center justify-center font-bold text-emerald-400 shrink-0 transition-colors shadow-inner">
                {emp.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={emp.avatarUrl}
                    alt={emp.firstName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  `${emp.firstName[0]}${emp.lastName[0]}`
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-base font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {emp.firstName} {emp.lastName}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {emp.position || "Staff"}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-2 bg-slate-900/50 w-fit px-2 py-0.5 rounded-md border border-slate-800/50">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{emp.department || "Operations"}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10">
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                {emp.employeeNumber || `EMP-${emp.id}`}
              </span>
              {emp.isEnrolled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
                </span>
              ) : (
                <button
                  onClick={onOpenEnrollment}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition shadow-sm shadow-amber-500/10 hover:shadow-amber-500/20"
                >
                  <ScanFace className="h-3.5 w-3.5" /> Enroll Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
