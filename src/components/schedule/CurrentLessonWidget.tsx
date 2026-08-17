import React from 'react';
import { ScheduleConfig, ScheduleLesson, ClassRoom } from '../../types';
import { useCurrentLessonTracker } from '../../utils/currentLessonTracker';
import {
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Zap,
  Coffee,
} from 'lucide-react';

interface CurrentLessonWidgetProps {
  config: ScheduleConfig;
  lessons: ScheduleLesson[];
  classes: ClassRoom[];
  onSelectClass?: (classId: string) => void;
  onNavigateSchedule?: () => void;
}

export const CurrentLessonWidget: React.FC<CurrentLessonWidgetProps> = ({
  config,
  lessons,
  classes,
  onSelectClass,
  onNavigateSchedule,
}) => {
  const { status } = useCurrentLessonTracker(config, lessons, classes);

  if (status.state === 'NO_SCHEDULE') {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-800/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
              {status.badgeLabel}
            </span>
          </div>
          {onNavigateSchedule && (
            <button
              onClick={onNavigateSchedule}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>Program Ekle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">{status.statusTitle}</h4>
            <p className="text-xs text-indigo-200">{status.statusSubtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === 'ONGOING' && status.currentLesson) {
    return (
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-lg border-2 border-indigo-500/80 relative overflow-hidden space-y-3 animate-in fade-in duration-200">
        {/* Subtle background glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-rose-400 fill-rose-400" /> CANLI DERS DEVAM EDİYOR
            </span>
          </div>

          {status.currentPeriod && (
            <span className="text-xs font-black bg-indigo-500/40 text-indigo-200 px-2.5 py-1 rounded-xl border border-indigo-400/30">
              {status.currentPeriod.period}. Ders ({status.currentPeriod.startTime} - {status.currentPeriod.endTime})
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl text-white font-black flex items-center justify-center text-lg shadow-md shrink-0 border border-white/20"
              style={{ backgroundColor: status.currentLesson.color || '#6366F1' }}
            >
              {status.currentLesson.shortName || 'DERS'}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>{status.currentLesson.title}</span>
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                {status.currentPeriod?.label} saatleri içerisindesiniz
              </p>
            </div>
          </div>

          {/* Live Countdown & Quick Action */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <div className="bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[9px] font-bold text-indigo-300 block uppercase tracking-wider">Bitimine Kalan</span>
              <span className="text-base font-black text-amber-300 tracking-tight flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                {status.formattedTimeRemaining}
              </span>
            </div>

            {status.currentClassId && onSelectClass ? (
              <button
                onClick={() => onSelectClass(status.currentClassId!)}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Sınıfa Git & Yoklama Al</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : onNavigateSchedule ? (
              <button
                onClick={onNavigateSchedule}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (status.state === 'BREAK' && status.nextLesson) {
    return (
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-amber-500/40 space-y-3 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-400" /> {status.badgeLabel}
            </span>
          </div>

          {status.nextPeriod && (
            <span className="text-xs font-black bg-white/10 text-amber-200 px-2.5 py-1 rounded-xl border border-white/10">
              {status.nextPeriod.period}. Ders ({status.nextPeriod.startTime})
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white font-black flex items-center justify-center text-base shadow-sm shrink-0 border border-white/20"
              style={{ backgroundColor: status.nextLesson.color || '#F59E0B' }}
            >
              {status.nextLesson.shortName || 'DERS'}
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{status.nextLesson.title}</span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {status.nextPeriod?.period}. ders saatiniz başlamak üzere
              </p>
            </div>
          </div>

          {/* Countdown timer & action button */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <div className="bg-black/40 border border-white/15 px-3.5 py-1.5 rounded-xl text-right">
              <span className="text-[9px] font-bold text-amber-300 block uppercase tracking-wider">Başlamasına Kalan</span>
              <span className="text-sm font-black text-amber-300 tracking-tight flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                {status.formattedTimeRemaining}
              </span>
            </div>

            {status.nextClassId && onSelectClass ? (
              <button
                onClick={() => onSelectClass(status.nextClassId!)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Sınıfa Hazırlan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : onNavigateSchedule ? (
              <button
                onClick={onNavigateSchedule}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // FINISHED_TODAY or NO_LESSONS_TODAY
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-800/40 space-y-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {status.badgeLabel}
          </span>
        </div>

        {onNavigateSchedule && (
          <button
            onClick={onNavigateSchedule}
            className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
          >
            <span>Ders Programı</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        {status.nextLesson ? (
          <>
            <div
              className="w-10 h-10 rounded-2xl text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0 border border-white/20"
              style={{ backgroundColor: status.nextLesson.color || '#6366F1' }}
            >
              {status.nextLesson.shortName || 'DERS'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">{status.nextLesson.title}</h4>
                <span className="text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md">
                  {status.nextLessonDayName}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {status.nextPeriod ? `${status.nextPeriod.period}. Ders (${status.nextPeriod.startTime})` : ''}
              </p>
            </div>
          </>
        ) : (
          <div>
            <h4 className="text-sm font-black text-white">{status.statusTitle}</h4>
            <p className="text-xs text-indigo-200">{status.statusSubtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
};
