import { 
  ClassRoom, Student, PerformanceLog, QuizScore, Homework, 
  HomeworkRecord, NotebookControl, WeightSettings, NotificationSetting, ParentFeedbackLog, User 
} from '../types';
import { 
  INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_PLUS_MINUS_LOGS, 
  INITIAL_QUIZZES, INITIAL_HOMEWORKS, INITIAL_HOMEWORK_RECORDS, 
  INITIAL_NOTEBOOK_CONTROLS, INITIAL_WEIGHT_SETTINGS, 
  INITIAL_NOTIFICATION_SETTINGS, INITIAL_FEEDBACK_LOGS 
} from '../mockData';

const KEYS = {
  USER: 'teacher_app_user',
  CLASSES: 'teacher_app_classes',
  STUDENTS: 'teacher_app_students',
  PLUS_MINUS: 'teacher_app_plus_minus',
  QUIZZES: 'teacher_app_quizzes',
  HOMEWORKS: 'teacher_app_homeworks',
  HW_RECORDS: 'teacher_app_hw_records',
  NOTEBOOKS: 'teacher_app_notebooks',
  WEIGHTS: 'teacher_app_weights',
  NOTIFICATIONS: 'teacher_app_notifications',
  FEEDBACKS: 'teacher_app_feedbacks',
};

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
  getUser: (): User => getItem(KEYS.USER, {
    id: 'usr-1',
    name: 'Mert Yılmaz',
    email: 'mert.ogretmen@okul.k12.tr',
    role: 'teacher',
    authMethod: 'email',
    subject: 'Matematik & Fen',
  }),
  setUser: (user: User) => setItem(KEYS.USER, user),

  getClasses: (): ClassRoom[] => getItem(KEYS.CLASSES, INITIAL_CLASSES),
  setClasses: (data: ClassRoom[]) => setItem(KEYS.CLASSES, data),

  getStudents: (): Student[] => getItem(KEYS.STUDENTS, INITIAL_STUDENTS),
  setStudents: (data: Student[]) => setItem(KEYS.STUDENTS, data),

  getPlusMinusLogs: (): PerformanceLog[] => getItem(KEYS.PLUS_MINUS, INITIAL_PLUS_MINUS_LOGS),
  setPlusMinusLogs: (data: PerformanceLog[]) => setItem(KEYS.PLUS_MINUS, data),

  getQuizzes: (): QuizScore[] => getItem(KEYS.QUIZZES, INITIAL_QUIZZES),
  setQuizzes: (data: QuizScore[]) => setItem(KEYS.QUIZZES, data),

  getHomeworks: (): Homework[] => getItem(KEYS.HOMEWORKS, INITIAL_HOMEWORKS),
  setHomeworks: (data: Homework[]) => setItem(KEYS.HOMEWORKS, data),

  getHomeworkRecords: (): HomeworkRecord[] => getItem(KEYS.HW_RECORDS, INITIAL_HOMEWORK_RECORDS),
  setHomeworkRecords: (data: HomeworkRecord[]) => setItem(KEYS.HW_RECORDS, data),

  getNotebookControls: (): NotebookControl[] => getItem(KEYS.NOTEBOOKS, INITIAL_NOTEBOOK_CONTROLS),
  setNotebookControls: (data: NotebookControl[]) => setItem(KEYS.NOTEBOOKS, data),

  getWeights: (): WeightSettings => getItem(KEYS.WEIGHTS, INITIAL_WEIGHT_SETTINGS),
  setWeights: (data: WeightSettings) => setItem(KEYS.WEIGHTS, data),

  getNotifications: (): NotificationSetting[] => getItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_SETTINGS),
  setNotifications: (data: NotificationSetting[]) => setItem(KEYS.NOTIFICATIONS, data),

  getFeedbacks: (): ParentFeedbackLog[] => getItem(KEYS.FEEDBACKS, INITIAL_FEEDBACK_LOGS),
  setFeedbacks: (data: ParentFeedbackLog[]) => setItem(KEYS.FEEDBACKS, data),

  resetToDefaults: () => {
    localStorage.clear();
  }
};
