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
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              subTab === "punches"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Today's Punches ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setSubTab("audit")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              subTab === "audit"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Biometric Scan Audit Log ({scanLogs.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500/70" />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="glass-panel rounded-[2.5rem] border border-slate-800/80 overflow-hidden shadow-2xl relative bg-slate-950/50">
        {subTab === "punches" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 backdrop-blur-md text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6 font-semibold">Employee</th>
                  <th className="py-4 px-6 font-semibold">Department</th>
                  <th className="py-4 px-6 font-semibold">Date</th>
                  <th className="py-4 px-6 font-semibold">Time In</th>
                  <th className="py-4 px-6 font-semibold">Time Out</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No attendance punches recorded yet for today.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-6 font-medium text-white flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 border border-slate-800 group-hover:border-emerald-500/30 transition-colors">
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
                        <span className="group-hover:text-emerald-400 transition-colors">{row.employeeName}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{row.department}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {row.date}
                      </td>
                      <td className="py-4 px-6 text-emerald-400 font-mono font-semibold">
                        {row.timeIn}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono">
                        {row.timeOut || "--:--"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
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
              <thead className="bg-slate-950/80 backdrop-blur-md text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6 font-semibold">Timestamp</th>
                  <th className="py-4 px-6 font-semibold">Candidate</th>
                  <th className="py-4 px-6 font-semibold">Scan Result</th>
                  <th className="py-4 px-6 font-semibold">L2 Euclidean / Score</th>
                  <th className="py-4 px-6 font-semibold">Action Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No scan logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-6 text-slate-400 font-mono group-hover:text-slate-300 transition-colors">
                        {new Date(log.date_created).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-4 px-6 font-medium text-white group-hover:text-emerald-400 transition-colors">
                        {log.user ? (
                          <span>
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic group-hover:text-rose-400 transition-colors">
                            Unidentified Face
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {log.scan_status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                            <CheckCircle2 className="h-3.5 w-3.5" /> SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10">
                            <XCircle className="h-3.5 w-3.5" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {log.confidence_score !== null &&
                        log.confidence_score !== undefined
                          ? `Dist: ${Number(log.confidence_score).toFixed(3)}`
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
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
