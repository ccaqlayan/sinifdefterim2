import React, { useState } from 'react';
import { ScheduleConfig, ScheduleDay, ScheduleLesson, ClassRoom } from '../../types';
import { ALL_DAYS, DAY_FULL_NAMES, getTodayScheduleDay } from '../../utils/scheduleUtils';
import { useCurrentLessonTracker } from '../../utils/currentLessonTracker';
import { ScheduleConfirmModal } from './ScheduleConfirmModal';
import { Plus, Edit3, Trash2, Copy, BookOpen, Clock, AlertCircle, Sparkles, Zap } from 'lucide-react';

interface WeeklyScheduleGridProps {
  config: ScheduleConfig;
  lessons: ScheduleLesson[];
  classes: ClassRoom[];
  onAddLesson: (day: ScheduleDay, period: number) => void;
  onEditLesson: (lesson: ScheduleLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onDuplicateLesson?: (lesson: ScheduleLesson) => void;
  onSelectClass?: (classId: string) => void;
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
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ScheduleLesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<ScheduleLesson | null>(null);
  const todayDay = getTodayScheduleDay();

  const { status } = useCurrentLessonTracker(config, lessons, classes);

  const daysToRender = config.activeDays.length > 0 ? config.activeDays : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
  const periodsCount = config.periodsPerDay || 10;

  // Helper to find lesson at specific day and period
  const getLessonAt = (day: ScheduleDay, period: number) => {
    return lessons.find((l) => l.day === day && l.period === period);
  };

  // Helper to find period time
  const getPeriodTime = (period: number) => {
    return config.periodTimes.find((pt) => pt.period === period);
  };

  return (
    <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Container for table - responsive table layout */}
      <div className="w-full overflow-hidden sm:overflow-x-auto">
        <table className="w-full table-fixed sm:table-auto md:min-w-[640px] border-collapse text-center select-none">
          {/* Table Header: Days of the week */}
          <thead>
            <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
              {/* Top-Left Corner: Time / Period indicator */}
              <th className="p-1 sm:p-3 w-7 sm:w-16 md:w-20 font-black text-slate-400 border-r border-slate-800 text-[9px] sm:text-[11px] uppercase tracking-wider">
                <span className="block sm:hidden">#</span>
                <span className="hidden sm:inline">Saat / Ders</span>
              </th>
              {/* Day Headers */}
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

          {/* Table Body: Rows for each period */}
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
                        {/* Mobile: Big period number and compact time */}
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

                        {/* Tablet/Desktop: Full start/end time and badge */}
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

                      return (
                        <td
                          key={`${day}-${period}`}
                          className={`p-0.5 sm:p-1.5 border-r border-slate-100 last:border-r-0 align-middle h-11 sm:h-16 md:h-20 transition-all ${
                            isOngoing
                              ? 'bg-rose-100/60 font-black'
                              : isNext
                              ? 'bg-amber-100/50 font-bold'
                              : isToday
                              ? 'bg-indigo-50/30'
                              : ''
                          }`}
                        >
                          {lesson ? (
                            /* Occupied Lesson Card */
                            <div
                              onClick={() => setSelectedLesson(lesson)}
                              className={`w-full h-full min-h-[38px] sm:min-h-[58px] p-0.5 sm:p-1.5 rounded-lg sm:rounded-xl text-white font-black transition-all cursor-pointer flex flex-col justify-center items-center text-center relative group select-none overflow-hidden ${
                                isOngoing
                                  ? 'ring-4 ring-rose-500 border-2 border-amber-300 shadow-xl animate-pulse scale-[1.03] z-20'
                                  : isNext
                                  ? 'ring-2 ring-amber-400 border border-amber-300 shadow-md z-10'
                                  : 'shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                              }`}
                              style={{ backgroundColor: lesson.color }}
                              title={`${lesson.title} (${DAY_FULL_NAMES[day]} ${period}. Ders)`}
                            >
                              {/* Top Badge for Ongoing or Next */}
                              {isOngoing && (
                                <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-tight py-0.2 px-0.5 flex items-center justify-center gap-0.5 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>CANLI DERS</span>
                                </div>
                              )}

                              {isNext && !isOngoing && (
                                <div className="absolute top-0 inset-x-0 bg-amber-400 text-slate-950 text-[7px] sm:text-[9px] font-black uppercase tracking-tight py-0.2 px-0.5 flex items-center justify-center gap-0.5 shadow-xs">
                                  <span>SIRADAKİ</span>
                                </div>
                              )}

                              {/* Short name on all devices, styled to fit neatly on mobile */}
                              <span className={`text-[10px] sm:text-xs md:text-sm font-black tracking-tight leading-tight line-clamp-2 px-0.5 text-center break-words drop-shadow-xs ${
                                isOngoing || isNext ? 'mt-2.5 sm:mt-3' : ''
                              }`}>
                                {lesson.shortName || lesson.title}
                              </span>

                              {/* Live time remaining badge inside ongoing card */}
                              {isOngoing && status.formattedTimeRemaining && (
                                <span className="text-[7px] sm:text-[9px] font-black bg-black/40 text-amber-300 px-1 py-0.2 rounded mt-0.5 hidden sm:inline-block">
                                  {status.formattedTimeRemaining}
                                </span>
                              )}

                              {/* Full title only visible on tablet / desktop */}
                              {lesson.title && lesson.title !== lesson.shortName && !isOngoing && !isNext && (
                                <span className="text-[10px] opacity-90 font-medium truncate max-w-full hidden md:block">
                                  {lesson.title}
                                </span>
                              )}

                              {/* Hover Quick Edit Icon (Desktop only) */}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 p-1 rounded-md hidden sm:block">
                                <Edit3 className="w-3 h-3 text-white" />
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

                  {/* Lunch break visual separator if enabled */}
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

      {/* Lesson Quick Actions Popover/Modal */}
      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedLesson(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xs w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge */}
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

            {/* Actions */}
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
