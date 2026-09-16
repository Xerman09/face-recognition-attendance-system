"use client";

import React, { useState } from "react";
import { Employee } from "@/types";
import {
  Users,
  Search,
  CheckCircle2,
  ScanFace,
  Building,
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
    <div className="w-full space-y-4">
      {/* Stats Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Personnel</div>
            <div className="text-2xl font-semibold text-slate-100 mt-0.5">{employees.length}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Biometrics Enrolled</div>
            <div className="text-2xl font-semibold text-emerald-400 mt-0.5">{enrolledCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Enrollment Rate</div>
            <div className="text-2xl font-semibold text-slate-100 mt-0.5">{enrollmentRate}%</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center">
            <ScanFace className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterEnrolled("ALL")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterEnrolled === "ALL"
                ? "bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({employees.length})
          </button>
          <button
            onClick={() => setFilterEnrolled("ENROLLED")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterEnrolled === "ENROLLED"
                ? "bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Enrolled ({enrolledCount})
          </button>
          <button
            onClick={() => setFilterEnrolled("PENDING")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterEnrolled === "PENDING"
                ? "bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={onOpenEnrollment}
            className="py-1.5 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Enroll Face
          </button>
        </div>
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center font-semibold text-xs text-emerald-400 shrink-0">
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
                <h4 className="text-sm font-semibold text-slate-100 truncate">
                  {emp.firstName} {emp.lastName}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {emp.position || "Staff"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                  <Building className="h-3 w-3 text-slate-500" />
                  <span className="truncate">{emp.department || "Operations"}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {emp.employeeNumber || `EMP-${emp.id}`}
              </span>
              {emp.isEnrolled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Enrolled
                </span>
              ) : (
                <button
                  onClick={onOpenEnrollment}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                >
                  <ScanFace className="h-3 w-3" /> Enroll
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
