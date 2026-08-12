export type UserRole = 'teacher' | 'parent';
export type AuthMethod = 'email' | 'google';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authMethod: AuthMethod;
  subject?: string;
  childStudentId?: string; // For parent role
}

export interface ClassRoom {
  id: string;
  name: string; // e.g., "9-A"
  grade: string; // e.g., "9"
  subject: string; // e.g., "Matematik"
  term: string; // e.g., "2025-2026 2. Dönem"
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  number: string; // Student school number e.g. "104"
  name: string;
  surname: string;
  photoUrl?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  notes?: string;
}

export type PlusMinusCategory = 
  | 'Ders Katılımı' 
  | 'Ödev Hazırlığı' 
  | 'Sınıf Kuralları' 
  | 'Soru Çözümü' 
  | 'Grup Çalışması' 
  | 'Laboratuvar/Etkinlik'
  | 'Genel';

export interface PerformanceLog {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  type: 'plus' | 'minus';
  category: PlusMinusCategory;
  note?: string;
}

export interface QuizScore {
  id: string;
  studentId: string;
  classId: string;
  quizTitle: string; // e.g., "Quiz 1", "Yazılı Hazırlık"
  score: number; // 0 - 100
  date: string;
}

export interface Homework {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  assignedDate: string;
}

export type HomeworkStatus = 'completed' | 'missing' | 'late' | 'excused';

export interface HomeworkRecord {
  id: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatus;
  note?: string;
  updatedAt: string;
}

export type NotebookStatus = 'full' | 'missing' | 'partial';

export interface NotebookControl {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: NotebookStatus;
  percentage: number; // 0 - 100 slider value
  note?: string;
}

export interface WeightSettings {
  classId: string;
  quizWeight: number;      // default 30%
  plusMinusWeight: number; // default 25%
  homeworkWeight: number;  // default 25%
  notebookWeight: number;  // default 20%
}

export interface NotificationSetting {
  id: string;
  name: string;
  enabled: boolean;
  type: 'notebook_low' | 'homework_missing' | 'negative_plusminus' | 'low_quiz_avg';
  threshold: number; // e.g. 50 for notebook %, 2 for missing homeworks
  template: string;
}

export interface ParentFeedbackLog {
  id: string;
  studentId: string;
  parentPhone: string;
  message: string;
  channel: 'whatsapp' | 'sms' | 'email';
  sentAt: string;
  sentBy: string;
}

export interface OverallTermScore {
  studentId: string;
  studentName: string;
  studentNumber: string;
  plusCount: number;
  minusCount: number;
  plusMinusNormalized: number; // 0-100
  quizAverage: number; // 0-100
  homeworkScore: number; // 0-100
  notebookAverage: number; // 0-100
  finalScore: number; // 0-100 weighted
  letterGrade: string;
}
