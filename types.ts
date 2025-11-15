export interface School {
  name: string;
  address: string;
  phone: string;
  principal: string;
  academicYear: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'teacher';
  subjects?: string[];
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[];
}

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

export enum AppView {
  DASHBOARD = "Dashboard",
  GRADE_INPUT = "Input Nilai",
  SUMMARY = "Rekap Nilai",
  REPORT_CARD = "Raport",
  DATA_MANAGEMENT = "Manajemen Data",
  HISTORY = "Riwayat Perubahan",
}