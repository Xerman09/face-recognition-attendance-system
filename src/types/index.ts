export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  department_id?: number;
  position?: string;
  employeeNumber?: string;
  avatarUrl?: string;
  isEnrolled?: boolean;
}

export interface FaceBiometricRecord {
  id: number | string;
  user_id: number;
  face_encoding: string; // JSON array of 128 numbers
  image_reference_path?: string;
  is_active: boolean;
  registered_by?: number | string;
  registered_at?: string;
  user?: Employee;
}

export interface FaceScanLog {
  id: string | number;
  user_id: number | null;
  scan_status: "SUCCESS" | "FAILED";
  confidence_score: number | null;
  date_created: string;
  scan_type?: "CLOCK_IN" | "CLOCK_OUT" | "VERIFY";
  user?: Employee;
}

export interface AttendanceRecord {
  id: string;
  userId: number;
  employeeName: string;
  department: string;
  avatarUrl?: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  status: "PRESENT" | "LATE" | "OVERTIME";
}

export type ScanStatus =
  | "idle"
  | "detecting"
  | "waiting_liveness"
  | "scanning"
  | "success"
  | "error";

export type ScanMode = "CLOCK_IN" | "CLOCK_OUT" | "VERIFY";
