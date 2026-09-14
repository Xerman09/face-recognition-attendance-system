import { FaceBiometricRecord, FaceScanLog, Employee, AttendanceRecord } from "../types";
import { INITIAL_EMPLOYEES, INITIAL_SCAN_LOGS, INITIAL_ATTENDANCE } from "./mockData";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.NEXT_PUBLIC_DIRECTUS_STATIC_TOKEN;

const LOCAL_STORAGE_KEY_BIOMETRICS = "face_kiosk_biometrics_v1";
const LOCAL_STORAGE_KEY_LOGS = "face_kiosk_logs_v1";
const LOCAL_STORAGE_KEY_EMPLOYEES = "face_kiosk_employees_v1";
const LOCAL_STORAGE_KEY_ATTENDANCE = "face_kiosk_attendance_v1";

/**
 * Storage helpers for browser persistence fallback
 */
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

/**
 * Fetch all registered employees
 */
export async function getEmployees(): Promise<Employee[]> {
  if (typeof window === "undefined") return INITIAL_EMPLOYEES;

  // Try Directus if token available
  if (DIRECTUS_URL && DIRECTUS_TOKEN) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/items/user?limit=-1`, {
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const customUsers = json.data || [];
        if (customUsers.length > 0) {
          return customUsers.map((u: any) => ({
            id: u.user_id,
            firstName: u.user_fname || "Employee",
            lastName: u.user_lname || `#${u.user_id}`,
            email: u.user_email || "",
            department: "Dept " + (u.user_department || "Unknown"),
            department_id: u.user_department || 1,
            position: u.user_position || "Staff",
            employeeNumber: u.rf_id || `EMP-${u.user_id}`,
            avatarUrl: u.user_image ? `http://goatedcodoer:8056${u.user_image}` : undefined,
          }));
        }
      }
    } catch (e: any) {
      console.warn(`Directus fetch users failed: ${e.message}. Using local/mock store.`);
    }
  }

  return getLocal<Employee[]>(LOCAL_STORAGE_KEY_EMPLOYEES, INITIAL_EMPLOYEES);
}

/**
 * Fetch active face biometrics
 */
export async function getFaceBiometrics(): Promise<FaceBiometricRecord[]> {
  if (typeof window === "undefined") return [];

  if (DIRECTUS_URL && DIRECTUS_TOKEN) {
    try {
      const res = await fetch(
        `${DIRECTUS_URL}/items/user_face_biometrics?filter[is_active][_eq]=true&limit=-1`,
        {
          headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e: any) {
      console.warn(`Directus fetch biometrics failed: ${e.message}. Using local fallback.`);
    }
  }

  return getLocal<FaceBiometricRecord[]>(LOCAL_STORAGE_KEY_BIOMETRICS, []);
}

/**
 * Save new enrolled face biometric
 */
export async function saveFaceBiometric(
  userId: number,
  descriptor: number[],
  imageDataUrl?: string
): Promise<FaceBiometricRecord> {
  const payload: Partial<FaceBiometricRecord> = {
    user_id: userId,
    face_encoding: JSON.stringify(descriptor),
    is_active: true,
    registered_at: new Date().toISOString(),
  };

  // Try saving to Directus
  if (DIRECTUS_URL && DIRECTUS_TOKEN) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/items/user_face_biometrics`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e: any) {
      console.warn(`Directus biometric post failed: ${e.message}. Storing locally.`);
    }
  }

  // Fallback to local storage
  const current = getLocal<FaceBiometricRecord[]>(LOCAL_STORAGE_KEY_BIOMETRICS, []);
  // Deactivate previous for this user
  const updated = current.map((item) =>
    item.user_id === userId ? { ...item, is_active: false } : item
  );

  const newRecord: FaceBiometricRecord = {
    id: `local-bio-${Date.now()}`,
    user_id: userId,
    face_encoding: JSON.stringify(descriptor),
    image_reference_path: imageDataUrl,
    is_active: true,
    registered_at: new Date().toISOString(),
  };

  updated.push(newRecord);
  setLocal(LOCAL_STORAGE_KEY_BIOMETRICS, updated);

  // Mark employee as enrolled
  const employees = getLocal<Employee[]>(LOCAL_STORAGE_KEY_EMPLOYEES, INITIAL_EMPLOYEES);
  const updatedEmployees = employees.map((emp) =>
    emp.id === userId ? { ...emp, isEnrolled: true } : emp
  );
  setLocal(LOCAL_STORAGE_KEY_EMPLOYEES, updatedEmployees);

  return newRecord;
}

/**
 * Log scan attempt
 */
export async function logScanAttempt(
  userId: number | null,
  status: "SUCCESS" | "FAILED",
  confidenceScore: number | null,
  scanType: "CLOCK_IN" | "CLOCK_OUT" | "VERIFY" = "CLOCK_IN"
): Promise<FaceScanLog> {
  const logItem: FaceScanLog = {
    id: `log-${Date.now()}`,
    user_id: userId,
    scan_status: status,
    confidence_score: confidenceScore,
    date_created: new Date().toISOString(),
    scan_type: scanType,
  };

  if (DIRECTUS_URL && DIRECTUS_TOKEN) {
    try {
      await fetch(`${DIRECTUS_URL}/items/user_face_scan_logs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          scan_status: status,
          confidence_score: confidenceScore,
          scan_type: scanType,
        }),
      }).catch((e: any) => console.warn(`Directus network warning: ${e.message}`));
    } catch (e: any) {
      console.warn(`Directus scan log post failed: ${e.message}. Storing locally.`);
    }
  }

  // Always update local scan logs
  const logs = getLocal<FaceScanLog[]>(LOCAL_STORAGE_KEY_LOGS, INITIAL_SCAN_LOGS);
  const updatedLogs = [logItem, ...logs].slice(0, 100);
  setLocal(LOCAL_STORAGE_KEY_LOGS, updatedLogs);

  return logItem;
}

/**
 * Record attendance punch
 */
export async function recordAttendance(
  employee: Employee
): Promise<{ record: AttendanceRecord; mode: "CLOCK_IN" | "LUNCH_START" | "LUNCH_END" | "CLOCK_OUT" | "ALREADY_COMPLETED"; isLate: boolean }> {
  let detectedMode: "CLOCK_IN" | "LUNCH_START" | "LUNCH_END" | "CLOCK_OUT" | "ALREADY_COMPLETED" = "CLOCK_IN";
  let isLate = false;
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const records = getLocal<AttendanceRecord[]>(LOCAL_STORAGE_KEY_ATTENDANCE, INITIAL_ATTENDANCE);
  
  if (DIRECTUS_URL && DIRECTUS_TOKEN) {
    try {
      const todayDate = new Date();
      const logDateStr = todayDate.toISOString().split("T")[0];
      const pad = (n: number) => n.toString().padStart(2, "0");
      const timeStrDb = `${todayDate.getFullYear()}-${pad(todayDate.getMonth()+1)}-${pad(todayDate.getDate())} ${pad(todayDate.getHours())}:${pad(todayDate.getMinutes())}:${pad(todayDate.getSeconds())}`;

      let schedule: any = null;
      try {
        const schedRes = await fetch(`${DIRECTUS_URL}/items/department_schedule?filter[department_id][_eq]=${employee.department_id || 1}`, {
          headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
          cache: "no-store",
        });
        if (schedRes.ok) {
          const schedJson = await schedRes.json();
          if (schedJson.data && schedJson.data.length > 0) {
            schedule = schedJson.data[0];
          }
        }
      } catch (e) {
        console.warn("Failed to check department schedule", e);
      }

      const checkRes = await fetch(`${DIRECTUS_URL}/items/attendance_log?filter[user_id][_eq]=${employee.id}&filter[log_date][_eq]=${logDateStr}`, {
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
        cache: "no-store",
      });
      
      if (checkRes.ok) {
        const checkJson = await checkRes.json();
        const existing = checkJson.data && checkJson.data.length > 0 ? checkJson.data[0] : null;

        if (existing) {
          let forceTimeOut = false;
          if (schedule && schedule.work_end) {
            const endParts = schedule.work_end.split(":");
            const endDate = new Date(todayDate);
            endDate.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), parseInt(endParts[2] || "0", 10), 0);
            if (todayDate >= endDate) {
              forceTimeOut = true;
            }
          }

          if (existing.time_out) {
            detectedMode = "ALREADY_COMPLETED";
          } else if (forceTimeOut) {
            detectedMode = "CLOCK_OUT";
            await fetch(`${DIRECTUS_URL}/items/attendance_log/${existing.log_id}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
              body: JSON.stringify({ time_out: timeStrDb }),
            }).catch((e: any) => console.warn(`Directus patch warning: ${e.message}`));
          } else if (!existing.lunch_start) {
            detectedMode = "LUNCH_START";
            await fetch(`${DIRECTUS_URL}/items/attendance_log/${existing.log_id}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
              body: JSON.stringify({ lunch_start: timeStrDb }),
            }).catch((e: any) => console.warn(`Directus patch warning: ${e.message}`));
          } else if (!existing.lunch_end) {
            detectedMode = "LUNCH_END";
            await fetch(`${DIRECTUS_URL}/items/attendance_log/${existing.log_id}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
              body: JSON.stringify({ lunch_end: timeStrDb }),
            }).catch((e: any) => console.warn(`Directus patch warning: ${e.message}`));
          } else {
            detectedMode = "CLOCK_OUT";
            await fetch(`${DIRECTUS_URL}/items/attendance_log/${existing.log_id}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
              body: JSON.stringify({ time_out: timeStrDb }),
            }).catch((e: any) => console.warn(`Directus patch warning: ${e.message}`));
          }
        } else {
          detectedMode = "CLOCK_IN";
          let punchStatus = "On Time";
          
          if (schedule && schedule.work_start) {
            const startParts = schedule.work_start.split(":");
            const startDate = new Date(todayDate);
            startDate.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), parseInt(startParts[2] || "0", 10), 0);
            startDate.setMinutes(startDate.getMinutes() + (schedule.grace_period || 0));
            
            if (todayDate > startDate) {
              punchStatus = "Late";
              isLate = true;
            }
          }

          await fetch(`${DIRECTUS_URL}/items/attendance_log`, {
              method: "POST",
              headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: employee.id,
                department_id: employee.department_id || 1,
                log_date: logDateStr,
                time_in: timeStrDb,
                status: punchStatus
              }),
            }).catch((e: any) => console.warn(`Directus post warning: ${e.message}`));
        }

        // Return early to bypass local storage fallback which might have stale data
        return {
          record: {
            id: `att-${Date.now()}`,
            userId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            department: employee.department || "Staff",
            avatarUrl: employee.avatarUrl,
            date: today,
            timeIn: timeStr,
            status: isLate ? "LATE" : "PRESENT",
          },
          mode: detectedMode,
          isLate
        };
      }
    } catch (e: any) {
      console.warn(`Directus recordAttendance failed: ${e.message}`);
    }
  }
  const existingToday = records.find(
    (r) => r.userId === employee.id && r.date === today
  );

  let updatedRecord: AttendanceRecord;

  if (existingToday) {
    if (existingToday.timeOut) {
      detectedMode = "ALREADY_COMPLETED";
      updatedRecord = existingToday;
    } else {
      detectedMode = "CLOCK_OUT";
      existingToday.timeOut = timeStr;
      updatedRecord = existingToday;
      setLocal(
        LOCAL_STORAGE_KEY_ATTENDANCE,
        records.map((r) => (r.id === existingToday.id ? existingToday : r))
      );
    }
  } else {
    detectedMode = "CLOCK_IN";
    updatedRecord = {
      id: `att-${Date.now()}`,
      userId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      department: employee.department || "Staff",
      avatarUrl: employee.avatarUrl,
      date: today,
      timeIn: timeStr,
      status: "PRESENT",
    };
    setLocal(LOCAL_STORAGE_KEY_ATTENDANCE, [updatedRecord, ...records]);
  }

  return { record: updatedRecord, mode: detectedMode, isLate };
}

/**
 * Get recent scan logs
 */
export function getRecentLogs(): FaceScanLog[] {
  return getLocal<FaceScanLog[]>(LOCAL_STORAGE_KEY_LOGS, INITIAL_SCAN_LOGS);
}

/**
 * Get attendance records
 */
export function getAttendanceList(): AttendanceRecord[] {
  return getLocal<AttendanceRecord[]>(LOCAL_STORAGE_KEY_ATTENDANCE, INITIAL_ATTENDANCE);
}
