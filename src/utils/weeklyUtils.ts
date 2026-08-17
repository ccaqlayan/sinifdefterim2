/**
 * Weekly Summary Utility Functions
 * Date manipulation, week ranges, and formatting in Turkish.
 */

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TR_DAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

/**
 * Normalizes a date to YYYY-MM-DD string in local time
 */
export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates ISO week number
 */
export function getISOWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export interface WeekRange {
  startDateStr: string; // YYYY-MM-DD (Monday)
  endDateStr: string;   // YYYY-MM-DD (Sunday)
  startDay: number;
  startMonthName: string;
  endDay: number;
  endMonthName: string;
  year: number;
  weekNumber: number;
  formattedLabel: string;
  isCurrentWeek: boolean;
}

/**
 * Returns full week boundaries (Monday to Sunday) for any given date
 */
export function getWeekRange(dateInput: Date | string = new Date()): WeekRange {
  let refDate: Date;
  if (typeof dateInput === 'string') {
    const [y, m, d] = dateInput.slice(0, 10).split('-').map(Number);
    refDate = new Date(y, m - 1, d, 12, 0, 0);
  } else {
    refDate = new Date(dateInput.getTime());
  }

  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDateStr = toDateString(monday);
  const endDateStr = toDateString(sunday);

  const todayStr = toDateString(new Date());
  const isCurrentWeek = todayStr >= startDateStr && todayStr <= endDateStr;

  const startDay = monday.getDate();
  const startMonthName = TR_MONTHS[monday.getMonth()];
  const endDay = sunday.getDate();
  const endMonthName = TR_MONTHS[sunday.getMonth()];
  const year = sunday.getFullYear();
  const weekNumber = getISOWeekNumber(monday);

  let formattedLabel: string;
  if (monday.getMonth() === sunday.getMonth()) {
    formattedLabel = `${startDay} - ${endDay} ${startMonthName} ${year}`;
  } else {
    formattedLabel = `${startDay} ${startMonthName} - ${endDay} ${endMonthName} ${year}`;
  }

  return {
    startDateStr,
    endDateStr,
    startDay,
    startMonthName,
    endDay,
    endMonthName,
    year,
    weekNumber,
    formattedLabel,
    isCurrentWeek,
  };
}

/**
 * Returns date string for Monday of previous week
 */
export function getPreviousWeekMonday(currentMondayStr: string): string {
  const [y, m, d] = currentMondayStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  date.setDate(date.getDate() - 7);
  return toDateString(date);
}

/**
 * Returns date string for Monday of next week
 */
export function getNextWeekMonday(currentMondayStr: string): string {
  const [y, m, d] = currentMondayStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  date.setDate(date.getDate() + 7);
  return toDateString(date);
}

/**
 * Checks if a given date string is within [startDate, endDate]
 */
export function isDateInWeek(dateStr: string | undefined | null, startStr: string, endStr: string): boolean {
  if (!dateStr) return false;
  const clean = dateStr.slice(0, 10);
  return clean >= startStr && clean <= endStr;
}

/**
 * Formats a single date nicely, e.g. "14 Ağustos Cuma"
 */
export function formatFriendlyDateTR(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return `${d} ${TR_MONTHS[date.getMonth()]} ${TR_DAYS[date.getDay()]}`;
}
