export type UserRole = 'teacher' | 'admin';
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
  isDeleted?: boolean;
  deletedAt?: string;
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
  maxScore?: number;
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

export type HomeworkStatus = 'completed' | 'missing' | 'late' | 'excused' | 'partial' | 'unmarked' | 'done';

export interface HomeworkRecord {
  id: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatus;
  note?: string;
  updatedAt: string;
  classId?: string;
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
  isDeleted?: boolean;
  deletedAt?: string;
}

export type RoundingMode = 'none' | 'ceil5' | 'ceil10';

export interface WeightSettings {
  classId: string;
  quizWeight: number;      // default 30%
  plusMinusWeight: number; // default 25%
  homeworkWeight: number;  // default 25%
  notebookWeight: number;  // default 20%
  roundingMode?: RoundingMode; // 'none' | 'ceil5' | 'ceil10'
  quizPercent?: number;
  homeworkPercent?: number;
  notebookPercent?: number;
  plusMinusPercent?: number;
}

export interface NotificationSetting {
  id: string;
  name: string;
  enabled: boolean;
  type: 'notebook_low' | 'homework_missing' | 'negative_plusminus' | 'low_quiz_avg';
  threshold: number; // e.g. 50 for notebook %, 2 for missing homeworks
  template: string;
}

export interface NotificationSettingsConfig {
  homeworkDeadlineEnabled: boolean;
  homeworkDeadlineDays: number; // Son 1 gün, 2 gün, 3 gün vb. (Default: 2)
  quizUngradedAlertEnabled: boolean;
  quizUngradedDays: number; // Quiz üzerinden X gün geçtiğinde not girilmemişse (Default: 2)
  notebookUngradedAlertEnabled: boolean;
  notebookUngradedDays: number; // Defter kontrolü üzerinden X gün geçtiğinde not girilmemişse (Default: 3)
  soundEnabled: boolean;
  showOnDashboard: boolean;
}

export interface ParentFeedbackLog {
  id: string;
  studentId: string;
  parentPhone: string;
  message: string;
  channel: 'whatsapp' | 'sms' | 'email';
  sentAt: string;
  sentBy: string;
  classId?: string;
  type?: string;
  notes?: string;
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
// YILLIK DERS PLANLARI (ANNUAL CURRICULUM PLAN) TYPE DEFINITIONS
// ----------------------------------------------------
export interface AnnualPlanItem {
  id: string;
  grade: string;         // e.g. "5", "6", "7", "8", "9", "10", "11", "12" or "5. Sınıf"
  week: number;          // 1, 2, 3 ... 36
  dateRange?: string;    // e.g. "08 Eylül - 12 Eylül"
  theme: string;         // Tema / Ünite / Ünite Adı
  topic: string;         // Konu / Alt Konu
  outcome: string;       // Öğrenme Çıktısı / Kazanımlar
  description?: string;  // Açıklamalar / Yöntem / Etkinlik / Araç-Gereç
  term?: number;         // 1 or 2
  subject?: string;      // e.g. "Bilişim Teknolojileri"
  updatedAt?: string;
}

export interface AnnualPlan {
  id: string;
  title: string;        // e.g. "2025-2026 Yıllık Ders Planı"
  subject?: string;
  gradeLevels: string[]; // e.g. ["5", "6", "7", "8"] or ["9", "10", "11", "12"]
  items: AnnualPlanItem[];
  updatedAt: string;
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
  defaultView?: 'daily' | 'grid' | 'list'; // Default landing view tab
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
  subject?: string;
  className?: string;
}

export type AuditLogCategory = 
  | 'notebook'      // Defter Kontrolü
  | 'plusminus'     // Artı / Eksi & Performans
  | 'plus_minus'    // Alias
  | 'quiz'          // Quiz & Sınavlar
  | 'homework'      // Ödev & Teslimatlar
  | 'student'       // Öğrenci İşlemleri
  | 'class'         // Sınıf Yönetimi
  | 'schedule'      // Ders Programı
  | 'parent'        // Veli İletişim / Bildirim
  | 'feedback'      // Alias
  | 'settings'      // Ayarlar & Dönem
  | 'trash'         // Çöp Kutusu & Geri Yükleme
  | 'auth';         // Giriş & Profil

export type AuditLogActionType = 
  | 'create'        // Yeni Ekleme
  | 'update'        // Güncelleme
  | 'delete'        // Silme (Çöp Kutusu)
  | 'restore'       // Geri Yükleme
  | 'perm_delete'   // Kalıcı Silme
  | 'bulk_save'     // Toplu Kayıt
  | 'bulk_action'   // Alias
  | 'bulk_import'   // Toplu İçe Aktarma
  | 'send_message'  // Bildirim Gönderme
  | 'reset';        // Sıfırlama / Temizleme

export interface AuditLogStudentDetail {
  studentId: string;
  studentName?: string;
  studentNumber?: string;
  actionSummary?: string; // e.g. "Defter Durumu: Tam (%100) - Not: Çok düzenli" or "+1 Artı: Ders Katılımı"
  changeSummary?: string; // Alias
  oldValue?: string | number;
  newValue?: string | number;
  badgeType?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string e.g. "2026-08-17T11:15:30.000Z"
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM
  category: AuditLogCategory;
  actionType: AuditLogActionType;
  title: string;     // e.g. "9-A Sınıfı Defter Kontrolü Kaydedildi"
  description: string; // e.g. "5 öğrenci için defter durumu sisteme işlendi."
  classId?: string;
  className?: string;
  isBulk?: boolean;
  affectedCount?: number; // e.g. 5
  studentDetails?: AuditLogStudentDetail[];
  metadata?: Record<string, any>;
  performedBy?: {
    userId?: string;
    userName?: string;
    role?: string;
  };
}

// Student Early Warning & Risk Radar Types
export type RiskLevel = 'critical' | 'moderate' | 'mild' | 'safe';

export type RiskReasonCode =
  | 'homework_drop'
  | 'minus_accumulation'
  | 'low_quiz_score'
  | 'notebook_issue'
  | 'general_decline';

export interface StudentRiskReason {
  code: RiskReasonCode;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface StudentRiskProfile {
  student: Student;
  classRoom?: ClassRoom;
  riskLevel: RiskLevel;
  overallRiskScore: number; // 0 to 100
  
  // Last 3 weeks metrics
  homeworkTotal: number;
  homeworkCompleted: number;
  homeworkMissing: number;
  homeworkCompletionRate: number | null; // % (e.g. 33)
  
  plusCount3Weeks: number;
  minusCount3Weeks: number;
  netPlusMinus3Weeks: number;
  
  quizCount3Weeks: number;
  quizAverage3Weeks: number | null;
  
  notebookCount3Weeks: number;
  notebookAverage3Weeks: number | null;
  
  reasons: StudentRiskReason[];
  isRiskTriggered: boolean;
  recommendation: string;
  suggestedAction: string;
}

export interface RiskRadarConfig {
  enabled: boolean;
  windowDays: number; // e.g. 14, 21 (default 3 weeks), 28, 42
  homeworkThresholdPercent: number; // e.g. 50 (below 50% triggers alert)
  enableHomeworkAlert: boolean;
  maxMinusAllowed: number; // e.g. 2 minuses or net negative triggers alert
  enableMinusAlert: boolean;
  quizScoreThreshold: number; // e.g. 50 (below 50 triggers alert)
  enableQuizAlert: boolean;
  notebookThresholdPercent: number; // e.g. 50 (below 50% triggers alert)
  enableNotebookAlert: boolean;
  sensitivityLevel: 'high' | 'normal' | 'low';
}

export interface ClassRiskSummary {
  classId: string;
  className: string;
  totalStudents: number;
  criticalCount: number;
  moderateCount: number;
  mildCount: number;
  totalAtRiskCount: number;
  homeworkRiskCount: number;
  behaviorRiskCount: number;
  quizRiskCount: number;
  notebookRiskCount: number;
  riskPercentage: number;
}

export interface LessonLogNote {
  id: string;
  classId: string;
  className?: string;
  subject?: string;
  teacherId?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  rawInputText: string;
  resourceName?: string; // Derste kullanılan kaynak (Örn: MEB Ders Kitabı, Soru Bankası, Fasikül)
  lastTopic?: string;
  lastPageAndQuestion?: string;
  nextLessonActions?: string[];
  completedActions?: string[];
  classAtmosphereNote?: string;
  summary?: string;
  isResolved?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export type DashboardWidgetId =
  | 'current_lesson'
  | 'alerts_banner'
  | 'last_lesson_log'
  | 'class_hero_summary'
  | 'class_selector_slider'
  | 'student_risk_radar'
  | 'quick_actions_grid'
  | 'smart_warnings';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  category: string;
  iconName: string;
  enabled: boolean;
}

export interface DashboardLayoutConfig {
  widgets: DashboardWidgetConfig[];
  updatedAt?: string;
}



