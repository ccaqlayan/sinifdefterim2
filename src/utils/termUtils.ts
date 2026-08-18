import { AcademicYearConfig, ActiveTermSelection, PerformanceLog, Quiz, QuizScore, Homework, HomeworkRecord, NotebookControl, ParentFeedbackLog } from '../types';

export const DEFAULT_ACADEMIC_YEAR_CONFIG: AcademicYearConfig = {
  academicYear: '2025-2026',
  activeTermId: 'term2',
  term1: {
    name: '1. Dönem',
    startDate: '2025-09-08',
    endDate: '2026-01-16',
  },
  term2: {
    name: '2. Dönem',
    startDate: '2026-02-02',
    endDate: '2026-06-19',
  },
};

/**
 * Checks if a given date string (YYYY-MM-DD or ISO) falls within a selected term
 */
export function isDateInTerm(
  dateStr: string | undefined | null,
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig = DEFAULT_ACADEMIC_YEAR_CONFIG
): boolean {
  if (!dateStr) return false;
  const cleanDate = dateStr.slice(0, 10); // Extract YYYY-MM-DD

  if (termSelection === 'all') {
    // If 'all', accept any date between term1 start and term2 end (or any valid date in academic year)
    const minStart = config.term1.startDate <= config.term2.startDate ? config.term1.startDate : config.term2.startDate;
    const maxEnd = config.term1.endDate >= config.term2.endDate ? config.term1.endDate : config.term2.endDate;
    return cleanDate >= minStart && cleanDate <= maxEnd;
  }

  if (termSelection === 'term1') {
    return cleanDate >= config.term1.startDate && cleanDate <= config.term1.endDate;
  }

  if (termSelection === 'term2') {
    return cleanDate >= config.term2.startDate && cleanDate <= config.term2.endDate;
  }

  return true;
}

/**
 * Filter plus/minus performance logs by selected term
 */
export function filterLogsByTerm(
  logs: PerformanceLog[],
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): PerformanceLog[] {
  return logs.filter((log) => !log.isDeleted && isDateInTerm(log.date, termSelection, config));
}

/**
 * Filter quizzes (definitions) by selected term
 */
export function filterQuizDefsByTerm(
  quizzes: Quiz[],
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): Quiz[] {
  return quizzes.filter((q) => !q.isDeleted && isDateInTerm(q.date, termSelection, config));
}

/**
 * Filter quiz scores by selected term
 */
export function filterQuizScoresByTerm(
  quizScores: QuizScore[],
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): QuizScore[] {
  return quizScores.filter((qs) => isDateInTerm(qs.date, termSelection, config));
}

/**
 * Filter homeworks by selected term (based on dueDate or assignedDate)
 */
export function filterHomeworksByTerm(
  homeworks: Homework[],
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): Homework[] {
  return homeworks.filter(
    (hw) => !hw.isDeleted && (isDateInTerm(hw.dueDate, termSelection, config) || isDateInTerm(hw.assignedDate, termSelection, config))
  );
}

/**
 * Filter homework records by matching with filtered homeworks or updatedAt
 */
export function filterHomeworkRecordsByTerm(
  records: HomeworkRecord[],
  filteredHomeworkIds: Set<string>,
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): HomeworkRecord[] {
  return records.filter((r) => {
    if (filteredHomeworkIds.has(r.homeworkId)) return true;
    return isDateInTerm(r.updatedAt, termSelection, config);
  });
}

/**
 * Filter notebook controls by selected term
 */
export function filterNotebookControlsByTerm(
  notebooks: NotebookControl[],
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): NotebookControl[] {
  return notebooks.filter((nb) => !nb.isDeleted && isDateInTerm(nb.date, termSelection, config));
}

/**
 * Filter parent feedback messages by selected term
 */
export function filterFeedbackLogsByTerm(
  feedbacks: ParentFeedbackLog[],
  termSelection: ActiveTermSelection,
  config: AcademicYearConfig
): ParentFeedbackLog[] {
  return feedbacks.filter((fb) => isDateInTerm(fb.sentAt, termSelection, config));
}

/**
 * Returns formatted human-readable label for a term
 */
export function getTermLabel(termSelection: ActiveTermSelection, config: AcademicYearConfig): string {
  if (termSelection === 'term1') {
    return `${config.academicYear} ${config.term1.name}`;
  }
  if (termSelection === 'term2') {
    return `${config.academicYear} ${config.term2.name}`;
  }
  return `${config.academicYear} Tüm Yıl`;
}

/**
 * Returns formatted date range string for display
 */
export function getTermDateRangeString(termSelection: ActiveTermSelection, config: AcademicYearConfig): string {
  const formatDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  };

  if (termSelection === 'term1') {
    return `${formatDate(config.term1.startDate)} - ${formatDate(config.term1.endDate)}`;
  }
  if (termSelection === 'term2') {
    return `${formatDate(config.term2.startDate)} - ${formatDate(config.term2.endDate)}`;
  }
  return `${formatDate(config.term1.startDate)} - ${formatDate(config.term2.endDate)}`;
}

/**
 * Calculates the current academic week (1 to 36) dynamically based on academic calendar config and date
 */
export function getCurrentAcademicWeek(
  config: AcademicYearConfig = DEFAULT_ACADEMIC_YEAR_CONFIG,
  targetDate: Date = new Date()
): number {
  try {
    const todayStr = targetDate.toISOString().slice(0, 10);
    const t1Start = config.term1?.startDate || '2025-09-08';
    const t1End = config.term1?.endDate || '2026-01-16';
    const t2Start = config.term2?.startDate || '2026-02-02';
    const t2End = config.term2?.endDate || '2026-06-19';

    // If today is before 1st term start date
    if (todayStr < t1Start) {
      return 1;
    }

    // If today is after 2nd term end date
    if (todayStr > t2End) {
      return 36;
    }

    const todayMs = new Date(todayStr).getTime();
    const t1StartMs = new Date(t1Start).getTime();
    const t1EndMs = new Date(t1End).getTime();
    const t2StartMs = new Date(t2Start).getTime();

    // If today is in term 1
    if (todayStr <= t1End) {
      const diffDays = Math.floor((todayMs - t1StartMs) / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      return Math.min(Math.max(week, 1), 18);
    }

    // If today is in semester break between term 1 and term 2
    if (todayStr < t2Start) {
      return 18;
    }

    // Today is in term 2
    const diffDaysInTerm2 = Math.floor((todayMs - t2StartMs) / (1000 * 60 * 60 * 24));
    const term2Week = Math.floor(diffDaysInTerm2 / 7) + 1;
    const week = 18 + term2Week;
    return Math.min(Math.max(week, 19), 36);
  } catch (err) {
    return 1;
  }
}

/**
 * MEB Presets for common academic years
 */
export function getPresetDatesForAcademicYear(year: string): {
  term1: { name: string; startDate: string; endDate: string };
  term2: { name: string; startDate: string; endDate: string };
} {
  if (year === '2024-2025') {
    return {
      term1: { name: '1. Dönem', startDate: '2024-09-09', endDate: '2025-01-17' },
      term2: { name: '2. Dönem', startDate: '2025-02-03', endDate: '2025-06-20' },
    };
  }
  if (year === '2025-2026') {
    return {
      term1: { name: '1. Dönem', startDate: '2025-09-08', endDate: '2026-01-16' },
      term2: { name: '2. Dönem', startDate: '2026-02-02', endDate: '2026-06-19' },
    };
  }
  if (year === '2026-2027') {
    return {
      term1: { name: '1. Dönem', startDate: '2026-09-07', endDate: '2027-01-15' },
      term2: { name: '2. Dönem', startDate: '2027-02-01', endDate: '2027-06-18' },
    };
  }

  // Dynamic estimate based on start year
  const startYear = parseInt(year.split('-')[0], 10) || 2025;
  const endYear = startYear + 1;
  return {
    term1: { name: '1. Dönem', startDate: `${startYear}-09-08`, endDate: `${endYear}-01-16` },
    term2: { name: '2. Dönem', startDate: `${endYear}-02-02`, endDate: `${endYear}-06-19` },
  };
}
