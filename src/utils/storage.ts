import { 
  ClassRoom, Student, PerformanceLog, Quiz, QuizScore, Homework, 
  HomeworkRecord, NotebookControl, WeightSettings, NotificationSetting, ParentFeedbackLog, User, LuckyDrawSettings,
  ScheduleConfig, ScheduleLesson, AcademicYearConfig 
} from '../types';
import { 
  INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_PLUS_MINUS_LOGS, 
  INITIAL_QUIZ_DEFINITIONS, INITIAL_QUIZZES, INITIAL_HOMEWORKS, INITIAL_HOMEWORK_RECORDS, 
  INITIAL_NOTEBOOK_CONTROLS, INITIAL_WEIGHT_SETTINGS, 
  INITIAL_NOTIFICATION_SETTINGS, INITIAL_FEEDBACK_LOGS 
} from '../mockData';
import { DEFAULT_SCHEDULE_CONFIG, INITIAL_SCHEDULE_LESSONS } from './scheduleUtils';
import { DEFAULT_ACADEMIC_YEAR_CONFIG } from './termUtils';

export const DEFAULT_LUCKY_DRAW_SETTINGS: LuckyDrawSettings = {
  soundEnabled: true,
  autoExcludeWinner: false,
  spinDurationSeconds: 5,
  nameFormat: 'full',
  showStudentNumber: true,
};

export const GUEST_USER: User = {
  id: '',
  name: '',
  email: '',
  role: 'teacher',
  authMethod: 'email',
  isLoggedIn: false,
};

export const DEMO_USER: User = {
  id: 'usr-demo-teacher',
  name: 'Demo Öğretmen',
  email: 'demo.ogretmen@okul.k12.tr',
  role: 'teacher',
  authMethod: 'email',
  subject: 'Matematik & Fen Bilimleri',
  schoolName: 'Atatürk Ortaokulu',
  isLoggedIn: true,
  luckyDrawSettings: DEFAULT_LUCKY_DRAW_SETTINGS,
};

const GLOBAL_KEYS = {
  CURRENT_USER: 'teacher_app_current_user',
};

function getUserKey(userId: string | undefined, dataKey: string): string {
  const safeUserId = (userId || 'usr-demo-teacher').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `teacher_app_u_${safeUserId}_${dataKey}`;
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`LocalStorage read error for ${key}`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`LocalStorage write error for ${key}`, e);
  }
}

export const Storage = {
  getUser: (): User => getItem(GLOBAL_KEYS.CURRENT_USER, GUEST_USER),
  setUser: (user: User) => setItem(GLOBAL_KEYS.CURRENT_USER, user),

  getLuckyDrawSettings: (userId?: string): LuckyDrawSettings => 
    getItem(getUserKey(userId, 'lucky_draw_settings'), DEFAULT_LUCKY_DRAW_SETTINGS),
  setLuckyDrawSettings: (userId: string | undefined, settings: LuckyDrawSettings) => 
    setItem(getUserKey(userId, 'lucky_draw_settings'), settings),

  getClasses: (userId?: string): ClassRoom[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'classes'), isDemo ? INITIAL_CLASSES : []);
  },
  setClasses: (userId: string | undefined, data: ClassRoom[]) => 
    setItem(getUserKey(userId, 'classes'), data),

  getStudents: (userId?: string): Student[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'students'), isDemo ? INITIAL_STUDENTS : []);
  },
  setStudents: (userId: string | undefined, data: Student[]) => 
    setItem(getUserKey(userId, 'students'), data),

  getPlusMinusLogs: (userId?: string): PerformanceLog[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'plus_minus'), isDemo ? INITIAL_PLUS_MINUS_LOGS : []);
  },
  setPlusMinusLogs: (userId: string | undefined, data: PerformanceLog[]) => 
    setItem(getUserKey(userId, 'plus_minus'), data),

  getQuizDefinitions: (userId?: string): Quiz[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'quiz_defs'), isDemo ? INITIAL_QUIZ_DEFINITIONS : []);
  },
  setQuizDefinitions: (userId: string | undefined, data: Quiz[]) => 
    setItem(getUserKey(userId, 'quiz_defs'), data),

  getQuizzes: (userId?: string): QuizScore[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'quizzes'), isDemo ? INITIAL_QUIZZES : []);
  },
  setQuizzes: (userId: string | undefined, data: QuizScore[]) => 
    setItem(getUserKey(userId, 'quizzes'), data),

  getHomeworks: (userId?: string): Homework[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'homeworks'), isDemo ? INITIAL_HOMEWORKS : []);
  },
  setHomeworks: (userId: string | undefined, data: Homework[]) => 
    setItem(getUserKey(userId, 'homeworks'), data),

  getHomeworkRecords: (userId?: string): HomeworkRecord[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'hw_records'), isDemo ? INITIAL_HOMEWORK_RECORDS : []);
  },
  setHomeworkRecords: (userId: string | undefined, data: HomeworkRecord[]) => 
    setItem(getUserKey(userId, 'hw_records'), data),

  getNotebookControls: (userId?: string): NotebookControl[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'notebooks'), isDemo ? INITIAL_NOTEBOOK_CONTROLS : []);
  },
  setNotebookControls: (userId: string | undefined, data: NotebookControl[]) => 
    setItem(getUserKey(userId, 'notebooks'), data),

  getWeights: (userId?: string): WeightSettings => 
    getItem(getUserKey(userId, 'weights'), INITIAL_WEIGHT_SETTINGS),
  setWeights: (userId: string | undefined, data: WeightSettings) => 
    setItem(getUserKey(userId, 'weights'), data),

  getNotifications: (userId?: string): NotificationSetting[] => 
    getItem(getUserKey(userId, 'notifications'), INITIAL_NOTIFICATION_SETTINGS),
  setNotifications: (userId: string | undefined, data: NotificationSetting[]) => 
    setItem(getUserKey(userId, 'notifications'), data),

  getFeedbacks: (userId?: string): ParentFeedbackLog[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'feedbacks'), isDemo ? INITIAL_FEEDBACK_LOGS : []);
  },
  setFeedbacks: (userId: string | undefined, data: ParentFeedbackLog[]) => 
    setItem(getUserKey(userId, 'feedbacks'), data),

  getScheduleConfig: (userId?: string): ScheduleConfig => 
    getItem(getUserKey(userId, 'schedule_config'), DEFAULT_SCHEDULE_CONFIG),
  setScheduleConfig: (userId: string | undefined, config: ScheduleConfig) => 
    setItem(getUserKey(userId, 'schedule_config'), config),

  getScheduleLessons: (userId?: string): ScheduleLesson[] => {
    const isDemo = !userId || userId === 'usr-demo-teacher';
    return getItem(getUserKey(userId, 'schedule_lessons'), isDemo ? INITIAL_SCHEDULE_LESSONS : []);
  },
  setScheduleLessons: (userId: string | undefined, lessons: ScheduleLesson[]) => 
    setItem(getUserKey(userId, 'schedule_lessons'), lessons),

  getAcademicYearConfig: (userId?: string): AcademicYearConfig =>
    getItem(getUserKey(userId, 'academic_year_config'), DEFAULT_ACADEMIC_YEAR_CONFIG),
  setAcademicYearConfig: (userId: string | undefined, config: AcademicYearConfig) =>
    setItem(getUserKey(userId, 'academic_year_config'), config),

  resetToDefaults: () => {
    localStorage.clear();
  }
};


