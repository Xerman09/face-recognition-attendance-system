import { FaceBiometricRecord, FaceScanLog, Employee, AttendanceRecord } from "../types";
import { INITIAL_EMPLOYEES, INITIAL_SCAN_LOGS, INITIAL_ATTENDANCE } from "./mockData";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

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
      const res = await fetch(`${DIRECTUS_URL}/users?limit=-1`, {
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const directusUsers = json.data || [];
        if (directusUsers.length > 0) {
          return directusUsers.map((u: any) => ({
            id: u.id,
            firstName: u.first_name || "Employee",
            lastName: u.last_name || `#${u.id}`,
            email: u.email || "",
            department: u.title || "General Operations",
            position: u.description || "Staff",
            employeeNumber: `EMP-${u.id}`,
            avatarUrl: u.avatar ? `${DIRECTUS_URL}/assets/${u.avatar}` : undefined,
          }));
        }
      }
    } catch (e) {
      console.warn("Directus fetch users failed, using local/mock store", e);
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
    } catch (e) {
      console.warn("Directus fetch biometrics failed, using local fallback", e);
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
    } catch (e) {
      console.warn("Directus biometric post failed, storing locally", e);
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
      }).catch(console.error);
    } catch {
      // Ignore network errors
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
  employee: Employee,
  mode: "CLOCK_IN" | "CLOCK_OUT"
): Promise<AttendanceRecord> {
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
  const existingToday = records.find(
    (r) => r.userId === employee.id && r.date === today
  );

  let updatedRecord: AttendanceRecord;

  if (existingToday) {
    if (mode === "CLOCK_OUT") {
      existingToday.timeOut = timeStr;
    }
    updatedRecord = existingToday;
    setLocal(
      LOCAL_STORAGE_KEY_ATTENDANCE,
      records.map((r) => (r.id === existingToday.id ? existingToday : r))
    );
  } else {
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

  return updatedRecord;
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
