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
  setDirectusConfig,
} from "@/lib/directus";
import { loadModels, checkModelsStatus } from "@/lib/models";
import { Employee, FaceScanLog, AttendanceRecord, ScanMode, EntityConfig } from "@/types";
import { toast } from "sonner";
import { getEntities } from "./actions";
import { Building2, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState<ScanMode>("CLOCK_IN");
  const [activeTab, setActiveTab] = useState<"kiosk" | "logs" | "directory">("kiosk");
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Select Company Database</h1>
            <p className="text-slate-400">Choose the organization to configure the biometric terminal.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEntities.map(entity => (
              <button
                key={entity.id}
                onClick={() => handleSelectEntity(entity)}
                className="glass-panel p-6 rounded-[2rem] border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col items-start text-left relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none"
                  style={{ backgroundColor: entity.color }}
                />
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 relative z-10 border shadow-lg"
                  style={{ backgroundColor: `${entity.color}15`, borderColor: `${entity.color}40`, color: entity.color }}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{entity.name}</h3>
                <p className="text-xs text-slate-400 mb-6 flex-1">{entity.description || "Corporate Entity"}</p>
                <div className="flex items-center text-xs font-semibold mt-auto" style={{ color: entity.color }}>
                  Connect Terminal <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/20">
      {/* Top Navigation & Status Bar */}
      <TerminalHeader
        modelsLoaded={modelsLoaded}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isStreaming={isStreaming}
        activeEntityName={activeEntity.name}
        onSwitchEntity={() => setActiveEntity(null)}
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
          {activeEntity.name} Biometric Access Terminal • Ultra-Fast AI Face Recognition & Passive Liveness Verification
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
