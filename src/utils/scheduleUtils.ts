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
  { name: 'Mor', value: '#A855F7', textClass: 'text-white' },
  { name: 'Pembe', value: '#EC4899', textClass: 'text-white' },
  { name: 'Teal / Turkuaz', value: '#14B8A6', textClass: 'text-white' },
  { name: 'Toprak / Kahve', value: '#A16207', textClass: 'text-white' },
  { name: 'Koyu Gri', value: '#475569', textClass: 'text-white' },
];

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
