"use client";

import React, { useState } from "react";
import { FaceScanLog, AttendanceRecord } from "@/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface AttendanceLogsTableProps {
  scanLogs: FaceScanLog[];
  attendanceRecords: AttendanceRecord[];
}

export function AttendanceLogsTable({
  scanLogs,
  attendanceRecords,
}: AttendanceLogsTableProps) {
  const [subTab, setSubTab] = useState<"punches" | "audit">("punches");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAttendance = attendanceRecords.filter((rec) =>
    rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = scanLogs.filter((log) => {
    const name = log.user
      ? `${log.user.firstName} ${log.user.lastName}`
      : "Unknown User";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.scan_status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="w-full space-y-4">
      {/* Sub-Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setSubTab("punches")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === "punches"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Today's Attendance Punches ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setSubTab("audit")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === "audit"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Biometric Scan Audit Log ({scanLogs.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        {subTab === "punches" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Time In</th>
                  <th className="py-3.5 px-4 font-semibold">Time Out</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No attendance punches recorded yet for today.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                          {row.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.avatarUrl}
                              alt={row.employeeName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            row.employeeName.charAt(0)
                          )}
                        </div>
                        <span>{row.employeeName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{row.department}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-mono font-semibold">
                        {row.timeIn}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {row.timeOut || "--:--"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Candidate</th>
                  <th className="py-3.5 px-4 font-semibold">Scan Result</th>
                  <th className="py-3.5 px-4 font-semibold">L2 Euclidean / Score</th>
                  <th className="py-3.5 px-4 font-semibold">Action Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No scan logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(log.date_created).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {log.user ? (
                          <span>
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            Unidentified Face
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.scan_status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" /> SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="h-3 w-3" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {log.confidence_score !== null &&
                        log.confidence_score !== undefined
                          ? `Dist: ${Number(log.confidence_score).toFixed(3)}`
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {log.scan_type || "CLOCK_IN"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
