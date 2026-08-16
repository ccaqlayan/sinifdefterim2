export type UserRole = 'teacher' | 'parent';
export type AuthMethod = 'email' | 'google';

export type ActiveTermSelection = 'term1' | 'term2' | 'all';

export interface AcademicTermDetails {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface AcademicYearConfig {
  academicYear: string; // e.g. "2025-2026"
  activeTermId: ActiveTermSelection; // 'term1' | 'term2' | 'all'
  term1: AcademicTermDetails;
  term2: AcademicTermDetails;
}

export interface LuckyDrawSettings {
  soundEnabled: boolean;
  autoExcludeWinner: boolean;
  spinDurationSeconds: number; // 3, 5, 8, 12
  nameFormat: 'full' | 'short';
  showStudentNumber: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authMethod: AuthMethod;
  password?: string;
  hasCustomPassword?: boolean;
  subject?: string;
  schoolName?: string;
  photoUrl?: string;
  childStudentId?: string; // For parent role
  luckyDrawSettings?: LuckyDrawSettings;
  isLoggedIn?: boolean;
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

export interface Quiz {
  id: string;
  classId: string;
  title: string;
  date: string;
  description?: string;
  maxScore?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface QuizScore {
  id: string;
  quizId?: string;
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
  isDeleted?: boolean;
  deletedAt?: string;
}

export type HomeworkStatus = 'completed' | 'missing' | 'late' | 'excused' | 'partial' | 'unmarked';

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
  hasPlusMinusData: boolean;
  plusMinusNormalized: number | null; // 0-100 or null if no logs
  hasQuizData: boolean;
  quizAverage: number | null; // 0-100 or null if no quiz
  hasHomeworkData: boolean;
  homeworkScore: number | null; // 0-100 or null if no hw
  hasNotebookData: boolean;
  notebookAverage: number | null; // 0-100 or null if no notebook
  hasAnyData: boolean;
  finalScore: number | null; // 0-100 weighted or null if no data
  letterGrade: string;
}

// ----------------------------------------------------
// DERS PROGRAMI (TIMETABLE / SCHEDULE) TYPE DEFINITIONS
// ----------------------------------------------------
export type ScheduleDay = 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz';

export interface PeriodTime {
  period: number;        // 1, 2, 3...
  startTime: string;     // e.g. "09:00"
  endTime: string;       // e.g. "09:40"
  label?: string;        // e.g. "1. Ders"
}

export interface ScheduleConfig {
  periodsPerDay: number;           // e.g. 8, 10, 15 (default: 10)
  lessonDurationMinutes: number;   // e.g. 40 min
  breakDurationMinutes: number;    // e.g. 10 min
  firstLessonStartTime: string;    // e.g. "09:00"
  activeDays: ScheduleDay[];       // e.g. ['Pzt', 'Sal', 'Çar', 'Per', 'Cum']
  lunchBreakAfterPeriod?: number;  // e.g. 4 (after 4th period)
  lunchBreakMinutes?: number;      // e.g. 40 min
  periodTimes: PeriodTime[];       // List of custom/calculated start-end times
}

export interface ScheduleLesson {
  id: string;
  title: string;          // İsim (Örn: "10-C Matematik" veya "10-C")
  shortName: string;      // Kısaltma (Örn: "10C", "10C REH", "12D", "11E", "12A UYG")
  color: string;          // Hex Color code
  day: ScheduleDay;       // 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz'
  period: number;         // 1, 2, 3, 4, 5...
  startTime?: string;     // e.g. "09:00"
  endTime?: string;       // e.g. "09:40"
  classId?: string;       // Optional link to existing ClassRoom
  note?: string;          // Optional notes
}

