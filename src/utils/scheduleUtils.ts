import { ScheduleConfig, ScheduleDay, ScheduleLesson, PeriodTime } from '../types';

export const ALL_DAYS: ScheduleDay[] = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const DAY_FULL_NAMES: Record<ScheduleDay, string> = {
  Pzt: 'Pazartesi',
  Sal: 'Salı',
  Çar: 'Çarşamba',
  Per: 'Perşembe',
  Cum: 'Cuma',
  Cmt: 'Cumartesi',
  Paz: 'Pazar',
};

export const COLOR_PALETTE = [
  { name: 'Mercan / Kırmızı', value: '#EF4444', textClass: 'text-white' },
  { name: 'Koyu Kırmızı', value: '#DC2626', textClass: 'text-white' },
  { name: 'Fıstık Yeşili', value: '#84CC16', textClass: 'text-slate-900' },
  { name: 'Zümrüt Yeşil', value: '#10B981', textClass: 'text-white' },
  { name: 'Amber / Sarı', value: '#F59E0B', textClass: 'text-slate-900' },
  { name: 'Turuncu', value: '#F97316', textClass: 'text-white' },
  { name: 'Gök Mavisi', value: '#0EA5E9', textClass: 'text-white' },
  { name: 'Mavi', value: '#3B82F6', textClass: 'text-white' },
  { name: 'İndigo', value: '#6366F1', textClass: 'text-white' },
  { name: 'Açık Mor / Lila', value: '#C084FC', textClass: 'text-slate-900' },
  { name: 'Mor', value: '#8B5CF6', textClass: 'text-white' },
  { name: 'Pembe', value: '#EC4899', textClass: 'text-white' },
  { name: 'Teal / Turkuaz', value: '#14B8A6', textClass: 'text-white' },
  { name: 'Toprak / Kahve', value: '#A16207', textClass: 'text-white' },
  { name: 'Koyu Gri', value: '#475569', textClass: 'text-white' },
];

export const DISTINCT_CLASS_COLORS = [
  '#3B82F6', // 1. Mavi (Blue)
  '#10B981', // 2. Zümrüt Yeşili (Emerald)
  '#F59E0B', // 3. Amber / Sarı (Amber)
  '#8B5CF6', // 4. Mor (Purple)
  '#EC4899', // 5. Pembe (Pink)
  '#06B6D4', // 6. Turkuaz / Cyan (Cyan)
  '#EF4444', // 7. Mercan / Kırmızı (Red)
  '#F97316', // 8. Turuncu (Orange)
  '#14B8A6', // 9. Teal (Teal)
  '#6366F1', // 10. İndigo (Indigo)
  '#84CC16', // 11. Fıstık Yeşili (Lime)
  '#D946EF', // 12. Fuşya (Fuchsia)
  '#0EA5E9', // 13. Açık Mavi (Sky)
  '#A16207', // 14. Toprak / Kahve (Brown)
];

/**
 * Normalizes class strings for matching:
 * e.g. "9/C", "9C", "9-C", "9 / C", "9C Matematik", "9-C MAT4" -> "9C"
 */
export function normalizeClassName(input?: string): string {
  if (!input) return '';
  return input
    .toLocaleLowerCase('tr')
    .replace(/[\/\-\_\.\s]/g, '')
    .trim();
}

/**
 * Extracts class grade and section tokens (e.g. grade="9", section="C", code="9C")
 * Supports formats: "9/C", "9-C", "9C", "9 / C", "12/A", "10-B", "9C Matematik", "11/A SMAT"
 */
export function extractClassGradeAndSection(text?: string): { grade: string; section: string; code: string } | null {
  if (!text) return null;
  // Match patterns like "9/C", "9-C", "9C", "12/A", "10-B", "11 C", "9 / C", "9C Matematik"
  const match = text.match(/\b(1[0-2]|[1-9])\s*[\/\-\_\s]?\s*([a-zA-ZçÇğĞıİöÖşŞüÜ])\b/);
  if (match) {
    const grade = match[1];
    const section = match[2].toLocaleUpperCase('tr');
    return {
      grade,
      section,
      code: `${grade}${section}`,
    };
  }
  return null;
}

/**
 * Robust Class Matcher:
 * Automatically matches a schedule lesson (title, shortName, className) to the registered classes list.
 * Handles:
 * - "9/C", "9C", "9-C", "9 / C" matching class "9-C" or "9/C"
 * - "9C Matematik", "9/C MAT4", "9-C Seçmeli Matematik" matching class "9-C" (Matematik)
 * - Matching by exact grade and section or normalized names.
 */
export function findMatchingClass(
  lesson: { title?: string; shortName?: string; className?: string; subject?: string; classId?: string },
  classes: import('../types').ClassRoom[]
): import('../types').ClassRoom | null {
  if (!classes || classes.length === 0) return null;

  // If lesson already has a valid classId matching an existing class, return it
  if (lesson.classId) {
    const directMatch = classes.find((c) => c.id === lesson.classId);
    if (directMatch) return directMatch;
  }

  const sources = [lesson.className, lesson.shortName, lesson.title].filter(Boolean) as string[];

  // 1. Try Token Extraction (Grade + Section)
  for (const src of sources) {
    const extracted = extractClassGradeAndSection(src);
    if (extracted) {
      const match = classes.find((cls) => {
        const clsExtracted = extractClassGradeAndSection(cls.name);
        if (clsExtracted && clsExtracted.code === extracted.code) {
          return true;
        }
        if (cls.grade && String(cls.grade).trim() === extracted.grade) {
          const clsSectionLetters = cls.name.match(/[a-zA-ZçÇğĞıİöÖşŞüÜ]/g);
          if (clsSectionLetters && clsSectionLetters.some((s) => s.toLocaleUpperCase('tr') === extracted.section)) {
            return true;
          }
        }
        const normCls = normalizeClassName(cls.name);
        const normCode = normalizeClassName(extracted.code);
        return normCls === normCode || normCls.startsWith(normCode) || normCls.includes(normCode);
      });
      if (match) return match;
    }
  }

  // 2. Try Normalized String Match
  for (const src of sources) {
    const normSrc = normalizeClassName(src);
    for (const cls of classes) {
      const normCls = normalizeClassName(cls.name);
      if (normSrc === normCls || normSrc.startsWith(normCls) || normCls.startsWith(normSrc)) {
        return cls;
      }
    }
  }

  return null;
}

/**
 * Returns the matching class ID or null.
 */
export function findMatchingClassId(
  lesson: { title?: string; shortName?: string; className?: string; subject?: string; classId?: string } | string,
  classes: import('../types').ClassRoom[]
): string | null {
  if (typeof lesson === 'string') {
    return findMatchingClass({ title: lesson, shortName: lesson }, classes)?.id || null;
  }
  return findMatchingClass(lesson, classes)?.id || null;
}

/**
 * Automatically detects lunch break position and duration from period start & end times.
 * e.g. 5th period ends at 12:40, 6th starts at 13:30 -> 50 min gap after period 5.
 */
export function detectLunchBreakFromPeriodTimes(periodTimes: PeriodTime[]): {
  lunchBreakAfterPeriod?: number;
  lunchBreakMinutes?: number;
} {
  if (!periodTimes || periodTimes.length < 2) {
    return { lunchBreakAfterPeriod: undefined, lunchBreakMinutes: undefined };
  }

  const sorted = [...periodTimes].sort((a, b) => a.period - b.period);
  let maxGap = 0;
  let detectedAfterPeriod: number | undefined = undefined;

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = sorted[i].endTime;
    const nextStart = sorted[i + 1].startTime;
    if (currentEnd && nextStart) {
      const [endH, endM] = currentEnd.split(':').map((v) => parseInt(v, 10));
      const [startH, startM] = nextStart.split(':').map((v) => parseInt(v, 10));
      if (!isNaN(endH) && !isNaN(endM) && !isNaN(startH) && !isNaN(startM)) {
        const endTotalMinutes = endH * 60 + endM;
        const startTotalMinutes = startH * 60 + startM;
        const gap = startTotalMinutes - endTotalMinutes;

        // A lunch break is significantly longer than ordinary recess (usually >= 25 mins)
        if (gap >= 25 && gap > maxGap) {
          maxGap = gap;
          detectedAfterPeriod = sorted[i].period;
        }
      }
    }
  }

  if (detectedAfterPeriod !== undefined && maxGap >= 25) {
    return {
      lunchBreakAfterPeriod: detectedAfterPeriod,
      lunchBreakMinutes: maxGap,
    };
  }

  return { lunchBreakAfterPeriod: undefined, lunchBreakMinutes: undefined };
}

/**
 * Calculates start and end times for all periods based on config parameters.
 */
export function generatePeriodTimes(
  periodsCount: number = 10,
  firstStartTime: string = '09:00',
  lessonDurationMinutes: number = 40,
  breakDurationMinutes: number = 10,
  lunchBreakAfterPeriod: number = 4,
  lunchBreakMinutes: number = 40
): PeriodTime[] {
  const [startHourStr, startMinuteStr] = firstStartTime.split(':');
  let currentMinutes = parseInt(startHourStr, 10) * 60 + parseInt(startMinuteStr, 10);

  const periods: PeriodTime[] = [];

  for (let i = 1; i <= periodsCount; i++) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const startFormatted = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

    const endMinutes = currentMinutes + lessonDurationMinutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    periods.push({
      period: i,
      startTime: startFormatted,
      endTime: endFormatted,
      label: `${i}. Ders`,
    });

    // Advance time for next period
    if (lunchBreakAfterPeriod && i === lunchBreakAfterPeriod) {
      currentMinutes = endMinutes + lunchBreakMinutes;
    } else {
      currentMinutes = endMinutes + breakDurationMinutes;
    }
  }

  return periods;
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  defaultView: 'daily',
  periodsPerDay: 10,
  lessonDurationMinutes: 40,
  breakDurationMinutes: 10,
  firstLessonStartTime: '09:00',
  activeDays: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'],
  lunchBreakAfterPeriod: 4,
  lunchBreakMinutes: 40,
  periodTimes: generatePeriodTimes(10, '09:00', 40, 10, 4, 40),
};

/**
 * Sample lessons matching the screenshots (10C, 12D, 11E, 12A UYG, 10C REH, 12E).
 */
export const INITIAL_SCHEDULE_LESSONS: ScheduleLesson[] = [
  // Pazartesi
  { id: 'sch-1', title: '10-C Matematik', shortName: '10C', color: '#EF4444', day: 'Pzt', period: 1 },
  { id: 'sch-2', title: '10-C Matematik', shortName: '10C', color: '#EF4444', day: 'Pzt', period: 2 },
  { id: 'sch-3', title: '11-E Matematik', shortName: '11E', color: '#F59E0B', day: 'Pzt', period: 3 },
  { id: 'sch-4', title: '11-E Matematik', shortName: '11E', color: '#F59E0B', day: 'Pzt', period: 4 },
  { id: 'sch-5', title: '12-E Fizik', shortName: '12E', color: '#0EA5E9', day: 'Pzt', period: 6 },
  { id: 'sch-6', title: '12-E Fizik', shortName: '12E', color: '#0EA5E9', day: 'Pzt', period: 7 },

  // Salı
  { id: 'sch-7', title: '10-C Matematik', shortName: '10C', color: '#EF4444', day: 'Sal', period: 3 },
  { id: 'sch-8', title: '10-C Matematik', shortName: '10C', color: '#EF4444', day: 'Sal', period: 4 },
  { id: 'sch-9', title: '12-A Uygulama', shortName: '12A UYG', color: '#C084FC', day: 'Sal', period: 5 },
  { id: 'sch-10', title: '12-D Kimya', shortName: '12D', color: '#84CC16', day: 'Sal', period: 7 },
  { id: 'sch-11', title: '12-D Kimya', shortName: '12D', color: '#84CC16', day: 'Sal', period: 8 },

  // Çarşamba
  { id: 'sch-12', title: '12-D Kimya', shortName: '12D', color: '#84CC16', day: 'Çar', period: 1 },
  { id: 'sch-13', title: '12-D Kimya', shortName: '12D', color: '#84CC16', day: 'Çar', period: 2 },
  { id: 'sch-14', title: '10-C Matematik', shortName: '10C', color: '#EF4444', day: 'Çar', period: 5 },
  { id: 'sch-15', title: '10-C Matematik', shortName: '10C', color: '#EF4444', day: 'Çar', period: 6 },
  { id: 'sch-16', title: '12-E Fizik', shortName: '12E', color: '#0EA5E9', day: 'Çar', period: 7 },
  { id: 'sch-17', title: '12-E Fizik', shortName: '12E', color: '#0EA5E9', day: 'Çar', period: 8 },

  // Perşembe
  { id: 'sch-18', title: '10-C Rehberlik', shortName: '10C REH', color: '#DC2626', day: 'Per', period: 4 },
  { id: 'sch-19', title: '12-E Fizik', shortName: '12E', color: '#0EA5E9', day: 'Per', period: 5 },
  { id: 'sch-20', title: '12-E Fizik', shortName: '12E', color: '#0EA5E9', day: 'Per', period: 6 },
  { id: 'sch-21', title: '12-A Uygulama', shortName: '12A UYG', color: '#C084FC', day: 'Per', period: 7 },
  { id: 'sch-22', title: '12-A Uygulama', shortName: '12A UYG', color: '#C084FC', day: 'Per', period: 8 },

  // Cuma
  { id: 'sch-23', title: '12-D Kimya', shortName: '12D', color: '#84CC16', day: 'Cum', period: 7 },
  { id: 'sch-24', title: '12-D Kimya', shortName: '12D', color: '#84CC16', day: 'Cum', period: 8 },
];

/**
 * Returns Turkish day short code for today's Date (e.g. 'Pzt')
 */
export function getTodayScheduleDay(): ScheduleDay {
  const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
  const map: Record<number, ScheduleDay> = {
    1: 'Pzt',
    2: 'Sal',
    3: 'Çar',
    4: 'Per',
    5: 'Cum',
    6: 'Cmt',
    0: 'Paz',
  };
  return map[dayIndex] || 'Pzt';
}
