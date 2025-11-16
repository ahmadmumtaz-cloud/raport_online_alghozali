
export interface School {
  name: string;
  address: string;
  phone: string;
  principal: string;
  academicYear: string;
}

export type User = {
  id: string;
  name: string;
} & ({
  role: 'admin';
} | {
  role: 'teacher';
  subjects: string[];
} | {
  role: 'homeroom';
  class: string;
});

// Fix: Define and export the Teacher type as a specific User role to resolve import errors.
export type Teacher = User & { role: 'teacher' };


export interface HomeroomTeacher {
  id: string;
  name: string;
  class: string;
  contact: string;
}

export interface Student {
  id: string;
  name: string;
  studentId: string; // Nomor Induk
  class: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export interface Grade {
  studentId: string;
  subject: string;
  teacherId: string;
  class: string;
  semester: 1 | 2;
  score: number;
}

export interface HistoryLog {
    timestamp: Date;
    user: string;
    action: string;
    details: string;
}

export interface StudentLedgerData {
  studentId: string;
  studentName: string;
  scores: { [subject: string]: number };
  total: number;
  average: number;
  rank: number;
  predicate: string;
}

export enum AppView {
  DASHBOARD = "Dashboard",
  GRADE_INPUT = "Input Nilai",
  SUMMARY = "Rekap Nilai",
  REPORT_CARD = "Raport",
  DATA_MANAGEMENT = "Manajemen Data",
  HISTORY = "Riwayat Perubahan",
}