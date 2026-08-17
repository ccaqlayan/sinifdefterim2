import { useState, useEffect } from 'react';
import { ScheduleConfig, ScheduleDay, ScheduleLesson, PeriodTime, ClassRoom } from '../types';
import { DAY_FULL_NAMES, getTodayScheduleDay, generatePeriodTimes } from './scheduleUtils';

export type LessonState =
  | 'ONGOING'          // Currently in an active lesson
  | 'BREAK'            // In a break between lessons or before next lesson today
  | 'FINISHED_TODAY'   // Today's lessons finished
  | 'NO_LESSONS_TODAY' // Weekend or no lessons scheduled today
  | 'NO_SCHEDULE';     // No schedule lessons configured at all

export interface CurrentLessonStatus {
  state: LessonState;
  currentLesson: ScheduleLesson | null;
  currentPeriod: PeriodTime | null;
  currentClassId: string | null;

  nextLesson: ScheduleLesson | null;
  nextPeriod: PeriodTime | null;
  nextClassId: string | null;
  nextLessonDayName: string | null;
  nextLessonDayCode: ScheduleDay | null;

  remainingSeconds: number; // Seconds remaining in current lesson OR until next lesson
  formattedTimeRemaining: string; // e.g., "18 dk 42 sn" or "04:15"
  
  statusTitle: string;
  statusSubtitle: string;
  badgeLabel: string;
}

/**
 * Normalizes string for flexible matching (e.g. "10-C" -> "10C")
 */
export function findMatchingClassId(lessonName: string, classes: ClassRoom[]): string | null {
  if (!lessonName || !classes.length) return null;
  const cleanStr = (s: string) => s.replace(/[\s\-_]/g, '').toUpperCase();
  const target = cleanStr(lessonName);

  for (const c of classes) {
    const cName = cleanStr(c.name);
    if (target.includes(cName) || cName.includes(target)) {
      return c.id;
    }
  }
  return null;
}

/**
 * Converts "HH:MM" string to total seconds from midnight
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 3600 + m * 60;
}

/**
 * Formats seconds into "X dk Y sn" or "XX:YY"
 */
export function formatCountdownSeconds(totalSecs: number): string {
  if (totalSecs <= 0) return '00:00';
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours} saat ${mins} dk`;
  }
  return `${mins} dk ${pad(secs)} sn`;
}

/**
 * Main calculation engine for current / upcoming lesson status
 */
export function getCurrentOrNextLessonStatus(
  now: Date,
  config: ScheduleConfig,
  lessons: ScheduleLesson[],
  classes: ClassRoom[] = []
): CurrentLessonStatus {
  if (!lessons || lessons.length === 0) {
    return {
      state: 'NO_SCHEDULE',
      currentLesson: null,
      currentPeriod: null,
      currentClassId: null,
      nextLesson: null,
      nextPeriod: null,
      nextClassId: null,
      nextLessonDayName: null,
      nextLessonDayCode: null,
      remainingSeconds: 0,
      formattedTimeRemaining: '',
      statusTitle: 'Ders Programı Eklenmedi',
      statusSubtitle: 'Haftalık ders saatinizi girerek canlı ders takibinden yararlanın.',
      badgeLabel: 'DERS PROGRAMI',
    };
  }

  // Ensure period times exist
  const periods = config.periodTimes && config.periodTimes.length > 0
    ? config.periodTimes
    : generatePeriodTimes(
        config.periodsPerDay || 10,
        config.firstLessonStartTime || '09:00',
        config.lessonDurationMinutes || 40,
        config.breakDurationMinutes || 10,
        config.lunchBreakAfterPeriod || 4,
        config.lunchBreakMinutes || 40
      );

  const todayCode = getTodayScheduleDay();
  const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // 1. Check if we are currently inside an ongoing period today
  const activePeriod = periods.find((p) => {
    const pStart = parseTimeToSeconds(p.startTime);
    const pEnd = parseTimeToSeconds(p.endTime);
    return currentSecs >= pStart && currentSecs < pEnd;
  });

  if (activePeriod) {
    const activeLesson = lessons.find((l) => l.day === todayCode && l.period === activePeriod.period);
    
    if (activeLesson) {
      const endSecs = parseTimeToSeconds(activePeriod.endTime);
      const remainingSecs = Math.max(0, endSecs - currentSecs);
      const currentClassId = findMatchingClassId(activeLesson.shortName || activeLesson.title, classes);

      // Look for next lesson today or future
      const futureLessonsToday = lessons
        .filter((l) => l.day === todayCode && l.period > activePeriod.period)
        .sort((a, b) => a.period - b.period);

      let nextL: ScheduleLesson | null = null;
      let nextP: PeriodTime | null = null;

      if (futureLessonsToday.length > 0) {
        nextL = futureLessonsToday[0];
        nextP = periods.find((p) => p.period === nextL!.period) || null;
      }

      return {
        state: 'ONGOING',
        currentLesson: activeLesson,
        currentPeriod: activePeriod,
        currentClassId,
        nextLesson: nextL,
        nextPeriod: nextP,
        nextClassId: nextL ? findMatchingClassId(nextL.shortName || nextL.title, classes) : null,
        nextLessonDayName: 'Bugün',
        nextLessonDayCode: todayCode,
        remainingSeconds: remainingSecs,
        formattedTimeRemaining: formatCountdownSeconds(remainingSecs),
        statusTitle: `Şu Anki Dersin: ${activeLesson.title || activeLesson.shortName}`,
        statusSubtitle: `${activePeriod.period}. Ders • Bitimine ${formatCountdownSeconds(remainingSecs)} kaldı`,
        badgeLabel: 'CANLI DERS',
      };
    }
  }

  // 2. Check for upcoming lessons TODAY (breaks / before school starts)
  const todayLessons = lessons.filter((l) => l.day === todayCode);
  
  if (todayLessons.length > 0) {
    // Find lessons today that haven't ended yet
    const upcomingToday = todayLessons
      .map((l) => {
        const p = periods.find((pt) => pt.period === l.period);
        const pStartSecs = p ? parseTimeToSeconds(p.startTime) : 0;
        return { lesson: l, period: p, startSecs: pStartSecs };
      })
      .filter((item) => item.period && item.startSecs > currentSecs)
      .sort((a, b) => a.startSecs - b.startSecs);

    if (upcomingToday.length > 0) {
      const nextItem = upcomingToday[0];
      const remainingSecs = Math.max(0, nextItem.startSecs - currentSecs);
      const nextClassId = findMatchingClassId(nextItem.lesson.shortName || nextItem.lesson.title, classes);

      const isBreak = remainingSecs <= 30 * 60; // 30 mins or less = Break / Tenefüs

      return {
        state: 'BREAK',
        currentLesson: null,
        currentPeriod: null,
        currentClassId: null,
        nextLesson: nextItem.lesson,
        nextPeriod: nextItem.period || null,
        nextClassId,
        nextLessonDayName: 'Bugün',
        nextLessonDayCode: todayCode,
        remainingSeconds: remainingSecs,
        formattedTimeRemaining: formatCountdownSeconds(remainingSecs),
        statusTitle: `Sonraki Dersin: ${nextItem.lesson.title || nextItem.lesson.shortName}`,
        statusSubtitle: `${isBreak ? 'Tenefüstesiniz • ' : ''}${nextItem.period?.period}. Ders (${nextItem.period?.startTime}) başlamasına ${formatCountdownSeconds(remainingSecs)} kaldı`,
        badgeLabel: isBreak ? 'TENEFÜS / MOLA' : 'SIRADAKİ DERS',
      };
    }
  }

  // 3. Search FUTURE DAYS for the next upcoming lesson
  const allDaysOrder: ScheduleDay[] = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const todayIdx = allDaysOrder.indexOf(todayCode);

  for (let step = 1; step <= 7; step++) {
    const futureDayIdx = (todayIdx + step) % 7;
    const futureDayCode = allDaysOrder[futureDayIdx];

    const futureDayLessons = lessons
      .filter((l) => l.day === futureDayCode)
      .sort((a, b) => a.period - b.period);

    if (futureDayLessons.length > 0) {
      const nextL = futureDayLessons[0];
      const nextP = periods.find((p) => p.period === nextL.period) || null;
      const nextClassId = findMatchingClassId(nextL.shortName || nextL.title, classes);

      let dayNameLabel = DAY_FULL_NAMES[futureDayCode];
      if (step === 1) dayNameLabel = `Yarın (${DAY_FULL_NAMES[futureDayCode]})`;

      const isTodayFinished = todayLessons.length > 0;
      const state = isTodayFinished ? 'FINISHED_TODAY' : 'NO_LESSONS_TODAY';

      return {
        state,
        currentLesson: null,
        currentPeriod: null,
        currentClassId: null,
        nextLesson: nextL,
        nextPeriod: nextP,
        nextClassId,
        nextLessonDayName: dayNameLabel,
        nextLessonDayCode: futureDayCode,
        remainingSeconds: 0,
        formattedTimeRemaining: '',
        statusTitle: `Sonraki Ders: ${dayNameLabel} ${nextP ? nextP.period + '. Ders' : ''}`,
        statusSubtitle: `${nextL.title || nextL.shortName} ${nextP ? `(${nextP.startTime})` : ''}`,
        badgeLabel: isTodayFinished ? 'BUGÜN BİTTİ' : 'GELECEK DERS',
      };
    }
  }

  return {
    state: 'NO_LESSONS_TODAY',
    currentLesson: null,
    currentPeriod: null,
    currentClassId: null,
    nextLesson: null,
    nextPeriod: null,
    nextClassId: null,
    nextLessonDayName: null,
    nextLessonDayCode: null,
    remainingSeconds: 0,
    formattedTimeRemaining: '',
    statusTitle: 'Planlanmış Ders Bulunmuyor',
    statusSubtitle: 'Ders programınızda aktif bir ders kaydı bulunmamaktadır.',
    badgeLabel: 'DERS YOK',
  };
}

/**
 * Custom hook for live 1-second interval tracking
 */
export function useCurrentLessonTracker(
  config: ScheduleConfig,
  lessons: ScheduleLesson[],
  classes: ClassRoom[] = []
) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const status = getCurrentOrNextLessonStatus(now, config, lessons, classes);

  return { status, now };
}
