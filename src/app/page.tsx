"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TerminalHeader } from "@/components/kiosk/TerminalHeader";
import { ScannerTerminal } from "@/components/kiosk/ScannerTerminal";
import { AttendanceLogsTable } from "@/components/logs/AttendanceLogsTable";
import { PersonnelDirectory } from "@/components/directory/PersonnelDirectory";
import { FaceEnrollmentModal } from "@/components/enrollment/FaceEnrollmentModal";
import {
  getEmployees,
  getRecentLogs,
  getAttendanceList,
} from "@/lib/directus";
import { loadModels, checkModelsStatus } from "@/lib/models";
import { Employee, FaceScanLog, AttendanceRecord, ScanMode } from "@/types";
import { toast } from "sonner";

export default function HomePage() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState<ScanMode>("CLOCK_IN");
  const [activeTab, setActiveTab] = useState<"kiosk" | "logs" | "directory">("kiosk");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scanLogs, setScanLogs] = useState<FaceScanLog[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Load neural network models safely
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const status = await loadModels("/models");
        if (isMounted) {
          setModelsLoaded(status.isReady);
          if (status.isReady) {
            toast.success("AI Face Recognition neural weights loaded successfully.");
          } else {
            toast.error("Some AI models could not be loaded.");
          }
        }
      } catch (err) {
        console.error("Model loading error:", err);
        if (isMounted) {
          const current = checkModelsStatus();
          setModelsLoaded(current.isReady);
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh application data
  const refreshData = useCallback(async () => {
    try {
      const [emps, logs, atts] = await Promise.all([
        getEmployees(),
        Promise.resolve(getRecentLogs()),
        Promise.resolve(getAttendanceList()),
      ]);
      setEmployees(emps);
      setScanLogs(logs);
      setAttendanceRecords(atts);
    } catch (e) {
      console.warn("Failed to refresh records:", e);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/20">
      {/* Top Navigation & Status Bar */}
      <TerminalHeader
        modelsLoaded={modelsLoaded}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isStreaming={isStreaming}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {activeTab === "kiosk" && (
          <ScannerTerminal
            modelsLoaded={modelsLoaded}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            onScanCompleted={refreshData}
            onStreamStateChange={setIsStreaming}
          />
        )}

        {activeTab === "logs" && (
          <AttendanceLogsTable
            scanLogs={scanLogs}
            attendanceRecords={attendanceRecords}
          />
        )}

        {activeTab === "directory" && (
          <PersonnelDirectory
            employees={employees}
            onOpenEnrollment={() => setIsEnrollmentOpen(true)}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>
          UniHR Biometric Access Terminal • Ultra-Fast AI Face Recognition & Passive Liveness Verification
        </p>
      </footer>

      {/* Biometric Enrollment Modal */}
      <FaceEnrollmentModal
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        employees={employees}
        modelsLoaded={modelsLoaded}
        onEnrolled={refreshData}
      />
    </div>
  );
}
