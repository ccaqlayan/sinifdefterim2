import {
  Homework,
  HomeworkRecord,
  ClassRoom,
  Student,
  Quiz,
  QuizScore,
  NotebookControl,
  NotificationSettingsConfig,
} from '../types';
import { DEFAULT_NOTIFICATION_CONFIG } from '../mockData';

export interface UrgentHomeworkInfo {
  id: string;
  homework: Homework;
  classRoom?: ClassRoom;
  daysRemaining: number;
  hoursRemaining: number;
  timeRemainingText: string;
  isOverdue: boolean;
  dueDateFormatted: string;
  totalStudents: number;
  submittedCount: number;
  completionRate: number;
}

export interface UngradedQuizInfo {
  id: string;
  quiz: Quiz;
  classRoom?: ClassRoom;
  daysElapsed: number;
  quizDateFormatted: string;
  totalStudents: number;
  gradedCount: number;
  missingCount: number;
  completionRate: number;
  statusText: string;
}

export interface UngradedNotebookInfo {
  id: string;
  classId: string;
  classRoom?: ClassRoom;
  date: string;
  dateFormatted: string;
  daysElapsed: number;
  totalStudents: number;
  checkedCount: number;
  missingCount: number;
  completionRate: number;
  statusText: string;
}

export interface DashboardAlertsSummary {
  urgentHomeworks: UrgentHomeworkInfo[];
  ungradedQuizzes: UngradedQuizInfo[];
  ungradedNotebooks: UngradedNotebookInfo[];
  totalAlertsCount: number;
  homeworkCount: number;
  quizCount: number;
  notebookCount: number;
  hasAlerts: boolean;
}

/**
 * Parses YYYY-MM-DD date into timestamp at local midnight or end of day
 */
export function parseDateTimestamp(dateStr: string, endOfDay: boolean = false): number {
  if (!dateStr) return Date.now();
  const trimmed = dateStr.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const timePart = endOfDay ? 'T23:59:59' : 'T00:00:00';
    const d = new Date(`${trimmed}${timePart}`);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
}

/**
 * Backward-compatible helper to get homework due timestamp at end of day
 */
export function getHomeworkDueDateTimestamp(dateStr: string, endOfDay: boolean = true): number {
  return parseDateTimestamp(dateStr, endOfDay);
}

/**
 * Calculates urgent homeworks based on days threshold configured by teacher
 */
export function getUrgentHomeworks(
  homeworks: Homework[],
  homeworkRecords: HomeworkRecord[],
  classes: ClassRoom[],
  students: Student[],
  selectedClassId?: string,
  config: Partial<NotificationSettingsConfig> = DEFAULT_NOTIFICATION_CONFIG
): UrgentHomeworkInfo[] {
  if (config.homeworkDeadlineEnabled === false) {
    return [];
  }

  const thresholdDays = config.homeworkDeadlineDays ?? 2;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMidnight = new Date(todayStr + 'T00:00:00').getTime();

  return homeworks
    .filter((hw) => !hw.isDeleted)
    .filter((hw) => !selectedClassId || selectedClassId === 'all' || hw.classId === selectedClassId)
    .map((hw): UrgentHomeworkInfo | null => {
      const dueMidnight = parseDateTimestamp(hw.dueDate, false);
      const dueEndOfDay = parseDateTimestamp(hw.dueDate, true);
      const diffDays = Math.round((dueMidnight - nowMidnight) / (1000 * 60 * 60 * 24));
      const diffMs = dueEndOfDay - now.getTime();
      const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));

      // Overdue within last 5 days
      const isOverdue = diffDays < 0 && diffDays >= -5;
      // Due today or in the next thresholdDays
      const isDueSoon = diffDays >= 0 && diffDays <= thresholdDays;

      if (!isDueSoon && !isOverdue) {
        return null;
      }

      let timeRemainingText = '';
      if (diffDays < 0) {
        timeRemainingText = `${Math.abs(diffDays)} gün önce süresi doldu`;
      } else if (diffDays === 0) {
        timeRemainingText = 'Bugün son gün!';
      } else if (diffDays === 1) {
        timeRemainingText = 'Son 1 gün kaldı';
      } else {
        timeRemainingText = `${diffDays} gün kaldı`;
      }

      const classRoom = classes.find((c) => c.id === hw.classId);
      const classStudents = students.filter((s) => s.classId === hw.classId);
      const totalStudents = classStudents.length;

      const hwRecords = homeworkRecords.filter((r) => r.homeworkId === hw.id);
      const submittedCount = hwRecords.filter(
        (r) => r.status === 'completed' || r.status === 'late' || r.status === 'partial' || r.status === 'excused'
      ).length;

      const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

      const dueDateObj = new Date(parseDateTimestamp(hw.dueDate, true));
      const dueDateFormatted = dueDateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
      });

      return {
        id: hw.id,
        homework: hw,
        classRoom,
        daysRemaining: diffDays,
        hoursRemaining,
        timeRemainingText,
        isOverdue,
        dueDateFormatted,
        totalStudents,
        submittedCount,
        completionRate,
      };
    })
    .filter((item): item is UrgentHomeworkInfo => item !== null)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Calculates quizzes where quiz date is in the past by X days and grades are missing
 */
export function getUngradedQuizzes(
  quizzes: Quiz[],
  quizScores: QuizScore[],
  classes: ClassRoom[],
  students: Student[],
  selectedClassId?: string,
  config: Partial<NotificationSettingsConfig> = DEFAULT_NOTIFICATION_CONFIG
): UngradedQuizInfo[] {
  if (config.quizUngradedAlertEnabled === false) {
    return [];
  }

  const thresholdDays = config.quizUngradedDays ?? 2;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMidnight = new Date(todayStr + 'T00:00:00').getTime();

  return quizzes
    .filter((q) => !q.isDeleted)
    .filter((q) => !selectedClassId || selectedClassId === 'all' || q.classId === selectedClassId)
    .map((quiz): UngradedQuizInfo | null => {
      const quizMidnight = parseDateTimestamp(quiz.date, false);
      const daysElapsed = Math.floor((nowMidnight - quizMidnight) / (1000 * 60 * 60 * 24));

      // Quiz must have occurred at least thresholdDays ago and within last 60 days
      if (daysElapsed < thresholdDays || daysElapsed > 60) {
        return null;
      }

      const classRoom = classes.find((c) => c.id === quiz.classId);
      const classStudents = students.filter((s) => s.classId === quiz.classId);
      const totalStudents = classStudents.length;

      // Match quiz scores for this quiz by quizId or (classId + title)
      const scores = quizScores.filter(
        (qs) => (qs.quizId === quiz.id || (qs.classId === quiz.classId && qs.quizTitle === quiz.title)) &&
                qs.score !== null && qs.score !== undefined
      );

      const gradedCount = scores.length;
      const missingCount = Math.max(0, totalStudents - gradedCount);

      // If all students already graded, no alert needed
      if (missingCount === 0 && totalStudents > 0) {
        return null;
      }

      const completionRate = totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0;

      let statusText = '';
      if (gradedCount === 0) {
        statusText = `Hiç not girilmedi (${totalStudents} öğrenci)`;
      } else {
        statusText = `${missingCount} öğrencinin notu eksik`;
      }

      const quizDateObj = new Date(quizMidnight);
      const quizDateFormatted = quizDateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
      });

      return {
        id: quiz.id,
        quiz,
        classRoom,
        daysElapsed,
        quizDateFormatted,
        totalStudents,
        gradedCount,
        missingCount,
        completionRate,
        statusText,
      };
    })
    .filter((item): item is UngradedQuizInfo => item !== null)
    .sort((a, b) => b.daysElapsed - a.daysElapsed);
}

/**
 * Calculates notebook control dates where X days passed and grades are missing
 */
export function getUngradedNotebookControls(
  notebookControls: NotebookControl[],
  classes: ClassRoom[],
  students: Student[],
  selectedClassId?: string,
  config: Partial<NotificationSettingsConfig> = DEFAULT_NOTIFICATION_CONFIG
): UngradedNotebookInfo[] {
  if (config.notebookUngradedAlertEnabled === false) {
    return [];
  }

  const thresholdDays = config.notebookUngradedDays ?? 3;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMidnight = new Date(todayStr + 'T00:00:00').getTime();

  // Group existing notebook controls by classId + date
  const groups = new Map<string, { classId: string; date: string; controls: NotebookControl[] }>();

  notebookControls
    .filter((nb) => !nb.isDeleted)
    .filter((nb) => !selectedClassId || selectedClassId === 'all' || nb.classId === selectedClassId)
    .forEach((nb) => {
      const key = `${nb.classId}_${nb.date}`;
      if (!groups.has(key)) {
        groups.set(key, { classId: nb.classId, date: nb.date, controls: [] });
      }
      groups.get(key)!.controls.push(nb);
    });

  const results: UngradedNotebookInfo[] = [];

  groups.forEach((group, key) => {
    const nbMidnight = parseDateTimestamp(group.date, false);
    const daysElapsed = Math.floor((nowMidnight - nbMidnight) / (1000 * 60 * 60 * 24));

    if (daysElapsed < thresholdDays || daysElapsed > 60) {
      return;
    }

    const classRoom = classes.find((c) => c.id === group.classId);
    const classStudents = students.filter((s) => s.classId === group.classId);
    const totalStudents = classStudents.length;

    const checkedCount = group.controls.length;
    const missingCount = Math.max(0, totalStudents - checkedCount);

    if (missingCount === 0 && totalStudents > 0) {
      return;
    }

    const completionRate = totalStudents > 0 ? Math.round((checkedCount / totalStudents) * 100) : 0;

    let statusText = '';
    if (checkedCount === 0) {
      statusText = `Hiç defter kontrolü girilmedi`;
    } else {
      statusText = `${missingCount} öğrencinin defteri kontrol edilmedi`;
    }

    const nbDateObj = new Date(nbMidnight);
    const dateFormatted = nbDateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });

    results.push({
      id: key,
      classId: group.classId,
      classRoom,
      date: group.date,
      dateFormatted,
      daysElapsed,
      totalStudents,
      checkedCount,
      missingCount,
      completionRate,
      statusText,
    });
  });

  return results.sort((a, b) => b.daysElapsed - a.daysElapsed);
}

/**
 * Returns all dashboard alerts combined
 */
export function getAllDashboardAlerts(
  homeworks: Homework[],
  homeworkRecords: HomeworkRecord[],
  quizzes: Quiz[],
  quizScores: QuizScore[],
  notebookControls: NotebookControl[],
  classes: ClassRoom[],
  students: Student[],
  selectedClassId?: string,
  config: Partial<NotificationSettingsConfig> = DEFAULT_NOTIFICATION_CONFIG
): DashboardAlertsSummary {
  const urgentHomeworks = getUrgentHomeworks(homeworks, homeworkRecords, classes, students, selectedClassId, config);
  const ungradedQuizzes = getUngradedQuizzes(quizzes, quizScores, classes, students, selectedClassId, config);
  const ungradedNotebooks = getUngradedNotebookControls(notebookControls, classes, students, selectedClassId, config);

  const homeworkCount = urgentHomeworks.length;
  const quizCount = ungradedQuizzes.length;
  const notebookCount = ungradedNotebooks.length;
  const totalAlertsCount = homeworkCount + quizCount + notebookCount;

  return {
    urgentHomeworks,
    ungradedQuizzes,
    ungradedNotebooks,
    totalAlertsCount,
    homeworkCount,
    quizCount,
    notebookCount,
    hasAlerts: totalAlertsCount > 0,
  };
}
