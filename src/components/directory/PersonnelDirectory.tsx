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
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Personnel</div>
            <div className="text-2xl font-bold text-white mt-1">{employees.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-medium">Biometrics Enrolled</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{enrolledCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Enrollment Rate</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{enrollmentRate}%</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <ScanFace className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterEnrolled("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterEnrolled === "ALL"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({employees.length})
          </button>
          <button
            onClick={() => setFilterEnrolled("ENROLLED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterEnrolled === "ENROLLED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Enrolled ({enrolledCount})
          </button>
          <button
            onClick={() => setFilterEnrolled("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterEnrolled === "PENDING"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={onOpenEnrollment}
            className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition whitespace-nowrap active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            Enroll Face
          </button>
        </div>
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-emerald-400 shrink-0">
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
                <h4 className="text-sm font-bold text-white truncate">
                  {emp.firstName} {emp.lastName}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {emp.position || "Staff"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{emp.department || "Operations"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                {emp.employeeNumber || `EMP-${emp.id}`}
              </span>
              {emp.isEnrolled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" /> Face Enrolled
                </span>
              ) : (
                <button
                  onClick={onOpenEnrollment}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition"
                >
                  <ScanFace className="h-3 w-3" /> Enroll Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
