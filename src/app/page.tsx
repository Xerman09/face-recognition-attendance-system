"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TerminalHeader } from "@/components/kiosk/TerminalHeader";
import { ScannerTerminal } from "@/components/kiosk/ScannerTerminal";
import { FaceEnrollmentModal } from "@/components/enrollment/FaceEnrollmentModal";
import {
  getEmployees,
  getRecentLogs,
  getAttendanceList,
  setDirectusConfig,
} from "@/lib/directus";
import { loadModels, checkModelsStatus } from "@/lib/models";
import { Employee, FaceScanLog, AttendanceRecord, ScanMode, EntityConfig } from "@/types";
import { toast } from "sonner";
import { getEntities } from "./actions";
import { Building2, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function HomePage() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState<ScanMode>("CLOCK_IN");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scanLogs, setScanLogs] = useState<FaceScanLog[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [availableEntities, setAvailableEntities] = useState<EntityConfig[]>([]);
  const [activeEntity, setActiveEntity] = useState<EntityConfig | null>(null);

  // Load entities
  useEffect(() => {
    getEntities().then((data) => setAvailableEntities(data));
  }, []);

  // Load neural network models safely
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const status = await loadModels("/models");
        if (isMounted) {
          setModelsLoaded(status.isReady);
          if (status.isReady) {
            // models loaded silently
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
    if (!activeEntity) return; // Don't fetch until entity is selected
    
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
  }, [activeEntity]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSelectEntity = (entity: EntityConfig) => {
    setDirectusConfig(entity.url, entity.token);
    setActiveEntity(entity);
  };

  // If no entity is selected, show the selection screen
  if (!activeEntity) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900 flex flex-col items-center justify-center p-4 relative transition-colors">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Select Database</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Choose an organization to configure the biometric terminal.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEntities.map(entity => (
              <button
                key={entity.id}
                onClick={() => handleSelectEntity(entity)}
                className="group relative flex flex-col items-start p-5 rounded-xl bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none transition-all text-left"
              >
                {/* Top Accent Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: entity.color }} 
                />
                
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 shadow-sm"
                  >
                    <Building2 className="h-5 w-5" style={{ color: entity.color }} />
                  </div>
                  <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {entity.name}
                  </h3>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 flex-1 line-clamp-2">
                  {entity.description || "Corporate Entity"}
                </p>
                
                <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors mt-auto">
                  <span>Connect to database</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </button>
            ))}
          </div>

          {availableEntities.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              No entities configured in .env.local
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900 selection:bg-emerald-500/20 transition-colors">
      {/* Top Navigation & Status Bar */}
      <TerminalHeader
        modelsLoaded={modelsLoaded}
        isStreaming={isStreaming}
        activeEntityName={activeEntity.name}
        onSwitchEntity={() => setActiveEntity(null)}
      />

      {/* Main Container - Dedicated Face Recognition Terminal */}
      <main className="flex-1 min-h-0 max-w-6xl w-full mx-auto p-2 sm:p-4 flex flex-col justify-center">
        <ScannerTerminal
          modelsLoaded={modelsLoaded}
          activeMode={activeMode}
          onModeChange={setActiveMode}
          onScanCompleted={refreshData}
          onStreamStateChange={setIsStreaming}
        />
      </main>

      {/* Footer Info */}
      <footer className="w-full py-2 shrink-0 border-t border-slate-900 light:border-slate-200 text-center text-xs text-slate-500 light:text-slate-600">
        <p>
          {activeEntity.name} Biometric Terminal • Attendance Management System
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
