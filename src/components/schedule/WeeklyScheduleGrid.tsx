import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScheduleConfig, ScheduleDay, ScheduleLesson, ClassRoom } from '../../types';
import { ALL_DAYS, DAY_FULL_NAMES, getTodayScheduleDay } from '../../utils/scheduleUtils';
import { useCurrentLessonTracker } from '../../utils/currentLessonTracker';
import { ScheduleConfirmModal } from './ScheduleConfirmModal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  BookOpen, 
  Sparkles, 
  Move, 
  ArrowLeftRight
} from 'lucide-react';

interface WeeklyScheduleGridProps {
  config: ScheduleConfig;
  lessons: ScheduleLesson[];
  classes: ClassRoom[];
  onAddLesson: (day: ScheduleDay, period: number) => void;
  onEditLesson: (lesson: ScheduleLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onDuplicateLesson?: (lesson: ScheduleLesson) => void;
  onSelectClass?: (classId: string) => void;
  onMoveLesson?: (lesson: ScheduleLesson, targetDay: ScheduleDay, targetPeriod: number) => void;
}

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  config,
  lessons,
  classes,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onSelectClass,
  onMoveLesson,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ScheduleLesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<ScheduleLesson | null>(null);
  const todayDay = getTodayScheduleDay();

  const { status } = useCurrentLessonTracker(config, lessons, classes);

  const daysToRender = config.activeDays.length > 0 ? config.activeDays : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
  const periodsCount = config.periodsPerDay || 10;

  // Desktop HTML5 Drag & Drop State
  const [desktopDragLesson, setDesktopDragLesson] = useState<ScheduleLesson | null>(null);
  const [desktopDragOverSlot, setDesktopDragOverSlot] = useState<{ day: ScheduleDay; period: number } | null>(null);

  // Mobile 2-Second Long-Press Touch Drag State
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchDragLesson, setTouchDragLesson] = useState<ScheduleLesson | null>(null);
  const [touchCoords, setTouchCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchOverSlot, setTouchOverSlot] = useState<{ day: ScheduleDay; period: number } | null>(null);

  // Refs for tracking touch positions and timers accurately
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchDragLessonRef = useRef<ScheduleLesson | null>(null);
  const touchOverSlotRef = useRef<{ day: ScheduleDay; period: number } | null>(null);
  const isTouchDraggingRef = useRef<boolean>(false);

  // Keep refs in sync
  touchDragLessonRef.current = touchDragLesson;
  touchOverSlotRef.current = touchOverSlot;
  isTouchDraggingRef.current = isTouchDragging;

  // Helper to query which schedule slot cell is under a coordinate (x, y)
  const getSlotAtPoint = useCallback((x: number, y: number): { day: ScheduleDay; period: number } | null => {
    try {
      const elements = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
      for (const el of elements) {
        if (!el) continue;
        const slotEl = (el as HTMLElement).closest?.('[data-schedule-slot]');
        if (slotEl) {
          const day = slotEl.getAttribute('data-slot-day') as ScheduleDay;
          const period = parseInt(slotEl.getAttribute('data-slot-period') || '0', 10);
          if (day && period > 0) {
            return { day, period };
          }
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }, []);

  // Helper to find lesson at specific day and period
  const getLessonAt = (day: ScheduleDay, period: number) => {
    return lessons.find((l) => l.day === day && l.period === period);
  };

  // Helper to find period time
  const getPeriodTime = (period: number) => {
    return config.periodTimes.find((pt) => pt.period === period);
  };

  // Safe phone vibration trigger
  const triggerVibration = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration error
      }
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Global window listeners when mobile touch dragging is active
  useEffect(() => {
    if (!isTouchDragging) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isTouchDraggingRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      if (!touch) return;

      setTouchCoords({ x: touch.clientX, y: touch.clientY });
      const slot = getSlotAtPoint(touch.clientX, touch.clientY);
      touchOverSlotRef.current = slot;
      setTouchOverSlot(slot);
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!isTouchDraggingRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.changedTouches[0];
      let targetSlot = touchOverSlotRef.current;
      if (touch) {
        const found = getSlotAtPoint(touch.clientX, touch.clientY);
        if (found) targetSlot = found;
      }

      const draggedLesson = touchDragLessonRef.current;
      if (draggedLesson && targetSlot) {
        if (draggedLesson.day !== targetSlot.day || draggedLesson.period !== targetSlot.period) {
          onMoveLesson?.(draggedLesson, targetSlot.day, targetSlot.period);
          triggerVibration([40, 30, 40]);
        }
      }

      // Reset touch drag state
      setIsTouchDragging(false);
      isTouchDraggingRef.current = false;
      setTouchDragLesson(null);
      touchDragLessonRef.current = null;
      setTouchOverSlot(null);
      touchOverSlotRef.current = null;
      touchStartPosRef.current = null;
    };

    const handleGlobalTouchCancel = () => {
      setIsTouchDragging(false);
      isTouchDraggingRef.current = false;
      setTouchDragLesson(null);
      touchDragLessonRef.current = null;
      setTouchOverSlot(null);
      touchOverSlotRef.current = null;
      touchStartPosRef.current = null;
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleGlobalTouchCancel, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchCancel);
    };
  }, [isTouchDragging, getSlotAtPoint, onMoveLesson]);

  // Mobile Touch Handlers on Lesson Card
  const handleTouchStart = (lesson: ScheduleLesson, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Set 2.0-second (2000 ms) timer for touch dragging activation
    longPressTimerRef.current = setTimeout(() => {
      // 2 seconds completed! Vibrate phone and activate drag mode
      triggerVibration([100, 50, 100]);
      
      setTouchDragLesson(lesson);
      touchDragLessonRef.current = lesson;
      setIsTouchDragging(true);
      isTouchDraggingRef.current = true;
      setTouchCoords({ x: touch.clientX, y: touch.clientY });

      const initialSlot = getSlotAtPoint(touch.clientX, touch.clientY);
      touchOverSlotRef.current = initialSlot;
      setTouchOverSlot(initialSlot);
    }, 2000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If not yet dragging, check if finger moved (scrolling page or table)
    if (!isTouchDraggingRef.current && touchStartPosRef.current) {
      const touch = e.touches[0];
      if (touch) {
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const dist = Math.hypot(dx, dy);

        // If finger moved more than 8px before 2 seconds, cancel the timer so user can scroll freely
        if (dist > 8) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
      }
    }
  };

  const handleTouchEnd = (lesson: ScheduleLesson, e: React.TouchEvent) => {
    // Cancel 2-second hold timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If it was a quick tap (< 2000ms and not in drag mode), open the lesson details modal
    if (!isTouchDraggingRef.current) {
      const touch = e.changedTouches[0];
      if (touchStartPosRef.current && touch) {
        const dist = Math.hypot(
          touch.clientX - touchStartPosRef.current.x,
          touch.clientY - touchStartPosRef.current.y
        );
        const duration = Date.now() - touchStartTimeRef.current;

        // If tap was short (< 500ms) and didn't move, open modal
        if (dist < 10 && duration < 500) {
          setSelectedLesson(lesson);
        }
      }
    }
    touchStartPosRef.current = null;
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  // Desktop HTML5 Drag Handlers
  const handleDesktopDragStart = (lesson: ScheduleLesson, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', lesson.id);
    e.dataTransfer.effectAllowed = 'move';
    setDesktopDragLesson(lesson);
  };

  const handleDesktopDragEnd = () => {
    setDesktopDragLesson(null);
    setDesktopDragOverSlot(null);
  };

  const handleDesktopDragOver = (day: ScheduleDay, period: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!desktopDragOverSlot || desktopDragOverSlot.day !== day || desktopDragOverSlot.period !== period) {
      setDesktopDragOverSlot({ day, period });
    }
  };

  const handleDesktopDrop = (targetDay: ScheduleDay, targetPeriod: number, e: React.DragEvent) => {
    e.preventDefault();
    if (desktopDragLesson) {
      if (desktopDragLesson.day !== targetDay || desktopDragLesson.period !== targetPeriod) {
        onMoveLesson?.(desktopDragLesson, targetDay, targetPeriod);
      }
    }
    setDesktopDragLesson(null);
    setDesktopDragOverSlot(null);
  };

  // Active slot for highlight (either desktop or touch)
  const activeOverSlot = isTouchDragging ? touchOverSlot : desktopDragOverSlot;
  const activeDraggedLesson = isTouchDragging ? touchDragLesson : desktopDragLesson;

  return (
    <div className="space-y-2">
      {/* Helper Tip Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs font-semibold shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
            <Move className="w-3 h-3" />
            Sürükle - Bırak
          </span>
          <span className="text-[11px] sm:text-xs text-indigo-950 font-medium">
            <span className="hidden sm:inline">Ders kutularını tutup istediğiniz güne ve saate sürükleyerek yerini değiştirebilirsiniz.</span>
            <span className="sm:hidden">Mobilde derse <b>2 saniye basılı tuttuğunuzda telefon titreşir</b> ve sürükleme modu açılır. Kısa dokunma menüyü açar.</span>
          </span>
        </div>
        {activeDraggedLesson && (
          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3 text-amber-600" />
            Taşıma Modu Aktif
          </span>
        )}
      </div>

      <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="w-full overflow-hidden sm:overflow-x-auto">
          <table className="w-full table-fixed sm:table-auto md:min-w-[640px] border-collapse text-center select-none">
            {/* Table Header: Days of the week */}
            <thead>
              <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                <th className="p-1 sm:p-3 w-7 sm:w-16 md:w-20 font-black text-slate-400 border-r border-slate-800 text-[9px] sm:text-[11px] uppercase tracking-wider">
                  <span className="block sm:hidden">#</span>
                  <span className="hidden sm:inline">Saat / Ders</span>
                </th>
                {daysToRender.map((day) => {
                  const isToday = day === todayDay;
                  return (
                    <th
                      key={day}
                      className={`p-1 sm:p-3 font-black text-xs border-r border-slate-800 last:border-r-0 transition-colors ${
                        isToday ? 'bg-indigo-950 text-amber-300 font-black' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[11px] sm:text-sm font-black tracking-tight">{day}</span>
                        <span className="text-[10px] opacity-75 font-normal hidden sm:block">
                          {DAY_FULL_NAMES[day]}
                          {isToday && ' (Bugün)'}
                        </span>
                        {isToday && (
                          <span className="sm:hidden block w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {Array.from({ length: periodsCount }, (_, i) => i + 1).map((period) => {
                const pTime = getPeriodTime(period);
                const isLunchBreakRow = config.lunchBreakAfterPeriod && period === config.lunchBreakAfterPeriod;

                return (
                  <React.Fragment key={period}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                      {/* Period Time Column on Left */}
                      <td className="p-0.5 sm:p-2 md:p-2.5 bg-slate-50/90 border-r border-slate-200 text-slate-700 font-extrabold align-middle">
                        <div className="flex flex-col items-center justify-center">
                          <div className="block sm:hidden leading-none py-0.5">
                            <span className="text-[11px] font-black text-slate-900 leading-none">
                              {period}
                            </span>
                            {pTime && (
                              <span className="block text-[8px] text-slate-500 font-semibold leading-none mt-0.5">
                                {pTime.startTime}
                              </span>
                            )}
                          </div>

                          <div className="hidden sm:flex flex-col items-center justify-center">
                            <span className="text-slate-900 text-xs font-black">
                              {pTime?.startTime || `${period}. Ders`}
                            </span>
                            {pTime && (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {pTime.endTime}
                              </span>
                            )}
                            <span className="text-[9px] text-indigo-600/90 font-bold bg-indigo-50 px-1 py-0.2 rounded mt-0.5">
                              {period}. Ders
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Lesson Cells for Each Day */}
                      {daysToRender.map((day) => {
                        const lesson = getLessonAt(day, period);
                        const isToday = day === todayDay;

                        const isOngoing =
                          status.state === 'ONGOING' &&
                          status.currentLesson?.day === day &&
                          status.currentPeriod?.period === period;

                        const isNext =
                          status.nextLesson?.day === day &&
                          status.nextPeriod?.period === period;

                        const isHoveredSlot =
                          activeOverSlot?.day === day && activeOverSlot?.period === period;
                        
                        const isSelfBeingDragged =
                          activeDraggedLesson &&
                          activeDraggedLesson.day === day &&
                          activeDraggedLesson.period === period;

                        const showDropHighlight = isHoveredSlot && !isSelfBeingDragged;

                        return (
                          <td
                            key={`${day}-${period}`}
                            data-schedule-slot="true"
                            data-slot-day={day}
                            data-slot-period={period}
                            onDragOver={(e) => handleDesktopDragOver(day, period, e)}
                            onDrop={(e) => handleDesktopDrop(day, period, e)}
                            className={`p-0.5 sm:p-1.5 border-r border-slate-100 last:border-r-0 align-middle h-11 sm:h-16 md:h-20 transition-all relative ${
                              showDropHighlight
                                ? lesson
                                  ? 'bg-amber-100/90 ring-2 ring-inset ring-amber-500 scale-[1.02] z-30 shadow-md'
                                  : 'bg-emerald-100/90 ring-2 ring-inset ring-emerald-500 scale-[1.02] z-30 shadow-md'
                                : isOngoing
                                ? 'bg-rose-100/60 font-black'
                                : isNext
                                ? 'bg-amber-100/50 font-bold'
                                : isToday
                                ? 'bg-indigo-50/30'
                                : ''
                            }`}
                          >
                            {/* Drop Target Badge Indicator */}
                            {showDropHighlight && (
                              <div className="absolute inset-0.5 rounded-lg sm:rounded-xl pointer-events-none z-30 flex flex-col items-center justify-center bg-black/50 text-white animate-in fade-in zoom-in-95 duration-100">
                                {lesson ? (
                                  <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-tight shadow-md">
                                    <ArrowLeftRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    <span>Yer Değiştir</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-tight shadow-md">
                                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    <span>Buraya Bırak</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {lesson ? (
                              <div
                                draggable={true}
                                onDragStart={(e) => handleDesktopDragStart(lesson, e)}
                                onDragEnd={handleDesktopDragEnd}
                                onTouchStart={(e) => handleTouchStart(lesson, e)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={(e) => handleTouchEnd(lesson, e)}
                                onTouchCancel={handleTouchCancel}
                                onContextMenu={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  // Click for desktop or immediate selection
                                  if (!isTouchDraggingRef.current) {
                                    setSelectedLesson(lesson);
                                  }
                                }}
                                className={`w-full h-full min-h-[38px] sm:min-h-[58px] p-0.5 sm:p-1.5 rounded-lg sm:rounded-xl text-white font-black transition-all cursor-grab active:cursor-grabbing flex flex-col justify-center items-center text-center relative group select-none overflow-hidden ${
                                  isSelfBeingDragged
                                    ? 'opacity-25 scale-95 border-2 border-dashed border-white ring-2 ring-slate-400'
                                    : isOngoing
                                    ? 'ring-4 ring-rose-500 border-2 border-amber-300 shadow-xl animate-pulse scale-[1.03] z-20'
                                    : isNext
                                    ? 'ring-2 ring-amber-400 border border-amber-300 shadow-md z-10'
                                    : 'shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                                style={{
                                  backgroundColor: lesson.color,
                                  touchAction: 'pan-x pan-y',
                                  WebkitTouchCallout: 'none',
                                  WebkitUserSelect: 'none',
                                }}
                                title={`${lesson.title} (${DAY_FULL_NAMES[day]} ${period}. Ders) - 2 saniye basılı tutarak sürükleyebilirsiniz`}
                              >
                                {/* Top Badge for Ongoing or Next */}
                                {isOngoing && !isSelfBeingDragged && (
                                  <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-tight py-0.2 px-0.5 flex items-center justify-center gap-0.5 shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    <span>CANLI DERS</span>
                                  </div>
                                )}

                                {isNext && !isOngoing && !isSelfBeingDragged && (
                                  <div className="absolute top-0 inset-x-0 bg-amber-400 text-slate-950 text-[7px] sm:text-[9px] font-black uppercase tracking-tight py-0.2 px-0.5 flex items-center justify-center gap-0.5 shadow-xs">
                                    <span>SIRADAKİ</span>
                                  </div>
                                )}

                                {/* Short name */}
                                <span className={`text-[10px] sm:text-xs md:text-sm font-black tracking-tight leading-tight line-clamp-2 px-0.5 text-center break-words drop-shadow-xs ${
                                  isOngoing || isNext ? 'mt-2.5 sm:mt-3' : ''
                                }`}>
                                  {lesson.shortName || lesson.title}
                                </span>

                                {/* Time remaining */}
                                {isOngoing && status.formattedTimeRemaining && (
                                  <span className="text-[7px] sm:text-[9px] font-black bg-black/40 text-amber-300 px-1 py-0.2 rounded mt-0.5 hidden sm:inline-block">
                                    {status.formattedTimeRemaining}
                                  </span>
                                )}

                                {/* Full title on desktop */}
                                {lesson.title && lesson.title !== lesson.shortName && !isOngoing && !isNext && (
                                  <span className="text-[10px] opacity-90 font-medium truncate max-w-full hidden md:block">
                                    {lesson.title}
                                  </span>
                                )}

                                {/* Desktop Move Icon */}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1 rounded-md hidden sm:flex items-center gap-0.5">
                                  <Move className="w-2.5 h-2.5 text-amber-300" />
                                </div>
                              </div>
                            ) : (
                              /* Empty Cell with '+' action */
                              <button
                                type="button"
                                onClick={() => onAddLesson(day, period)}
                                className="w-full h-full min-h-[38px] sm:min-h-[58px] rounded-lg sm:rounded-xl border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/60 text-slate-300 hover:text-blue-600 transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-1 cursor-pointer group"
                                title={`${DAY_FULL_NAMES[day]} ${period}. derse yeni ders ekle`}
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 hidden group-hover:sm:inline">
                                  Ekle
                                </span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Lunch Break Row */}
                    {isLunchBreakRow && (
                      <tr className="bg-amber-50/80 border-y border-amber-200">
                        <td colSpan={daysToRender.length + 1} className="py-1 sm:py-1.5 px-2 sm:px-4 text-center">
                          <span className="text-[9px] sm:text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5">
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Öğle Arası Molası ({config.lunchBreakMinutes || 40} Dakika)</span>
                            <span className="inline sm:hidden">Öğle Arası ({config.lunchBreakMinutes || 40} dk)</span>
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Drag Avatar for Mobile 2-Second Long-Press Drag */}
      {isTouchDragging && touchDragLesson && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full will-change-transform pb-4"
          style={{ left: touchCoords.x, top: touchCoords.y - 10 }}
        >
          <div
            className="px-3.5 py-2.5 rounded-xl shadow-2xl text-white font-black flex items-center gap-2.5 border-2 border-white scale-110 rotate-2 ring-4 ring-amber-400/90 pointer-events-none"
            style={{ backgroundColor: touchDragLesson.color }}
          >
            <Move className="w-4 h-4 text-amber-300" />
            <div className="text-left">
              <div className="text-xs font-black leading-tight text-white drop-shadow-xs">
                {touchDragLesson.shortName || touchDragLesson.title}
              </div>
              <div className="text-[9px] text-amber-200 font-bold mt-0.5">
                {touchOverSlot ? `${DAY_FULL_NAMES[touchOverSlot.day]} ${touchOverSlot.period}. Ders` : 'Hedef hücreye bırakın'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Quick Actions Modal */}
      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedLesson(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xs w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-3 rounded-xl text-white font-black text-center shadow-xs flex flex-col items-center justify-center"
              style={{ backgroundColor: selectedLesson.color }}
            >
              <span className="text-base tracking-wide">{selectedLesson.shortName}</span>
              <span className="text-xs font-semibold opacity-90">{selectedLesson.title}</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Gün:</span>
                <span className="font-bold text-slate-800">{DAY_FULL_NAMES[selectedLesson.day]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Ders Saati:</span>
                <span className="font-bold text-slate-800">{selectedLesson.period}. Ders</span>
              </div>
              {selectedLesson.startTime && selectedLesson.endTime && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Zaman:</span>
                  <span className="font-bold text-indigo-700">{selectedLesson.startTime} - {selectedLesson.endTime}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button
                onClick={() => {
                  const toEdit = selectedLesson;
                  setSelectedLesson(null);
                  onEditLesson(toEdit);
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Dersi Düzenle
              </button>

              {onDuplicateLesson && (
                <button
                  onClick={() => {
                    const toDup = selectedLesson;
                    setSelectedLesson(null);
                    onDuplicateLesson(toDup);
                  }}
                  className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Bir Sonraki Saate Kopyala
                </button>
              )}

              {selectedLesson.classId && onSelectClass && (
                <button
                  onClick={() => {
                    const clsId = selectedLesson.classId!;
                    setSelectedLesson(null);
                    onSelectClass(clsId);
                  }}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Bu Sınıfın Listesine Git
                </button>
              )}

              <button
                onClick={() => {
                  const toDel = selectedLesson;
                  setSelectedLesson(null);
                  setLessonToDelete(toDel);
                }}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Programdan Kaldır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Lesson */}
      {lessonToDelete && (
        <ScheduleConfirmModal
          isOpen={!!lessonToDelete}
          onClose={() => setLessonToDelete(null)}
          onConfirm={() => {
            if (lessonToDelete) {
              onDeleteLesson(lessonToDelete.id);
              setLessonToDelete(null);
            }
          }}
          title="Dersi Programdan Kaldır"
          description="Bu dersi haftalık ders programınızdan silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Evet, Kaldır"
          cancelText="Vazgeç"
          type="danger"
          lessonPreview={{
            shortName: lessonToDelete.shortName,
            title: lessonToDelete.title,
            color: lessonToDelete.color,
            day: DAY_FULL_NAMES[lessonToDelete.day],
            period: lessonToDelete.period,
          }}
        />
      )}
    </div>
  );
};
