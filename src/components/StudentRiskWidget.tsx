import React, { useMemo } from 'react';
import {
  Student,
  ClassRoom,
  PerformanceLog,
  Homework,
  HomeworkRecord,
  Quiz,
  QuizScore,
  NotebookControl,
  RiskRadarConfig,
} from '../types';
import { calculateStudentRiskProfiles, DEFAULT_RISK_RADAR_CONFIG } from '../utils/studentRiskUtils';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';

interface StudentRiskWidgetProps {
  students: Student[];
  classes: ClassRoom[];
  plusMinusLogs: PerformanceLog[];
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  quizzes?: Quiz[];
  quizScores?: QuizScore[];
  notebookControls?: NotebookControl[];
  selectedClassId?: string;
  riskConfig?: RiskRadarConfig;
  onNavigateTab: (tab: string) => void;
  onSelectClass?: (classId: string) => void;
}

export const StudentRiskWidget: React.FC<StudentRiskWidgetProps> = ({
  students,
  classes,
  plusMinusLogs,
  homeworks,
  homeworkRecords,
  quizzes = [],
  quizScores = [],
  notebookControls = [],
  selectedClassId,
  riskConfig = DEFAULT_RISK_RADAR_CONFIG,
  onNavigateTab,
  onSelectClass,
}) => {
  // Calculate profiles for selected class or all classes
  const riskProfiles = useMemo(() => {
    return calculateStudentRiskProfiles(
      students,
      classes,
      plusMinusLogs,
      homeworks,
      homeworkRecords,
      quizzes,
      quizScores,
      notebookControls,
      {
        windowDays: riskConfig.windowDays,
        classId: selectedClassId || 'all',
        config: riskConfig,
      }
    );
  }, [
    students,
    classes,
    plusMinusLogs,
    homeworks,
    homeworkRecords,
    quizzes,
    quizScores,
    notebookControls,
    selectedClassId,
    riskConfig,
  ]);

  const atRiskStudents = useMemo(() => {
    return riskProfiles.filter((p) => p.isRiskTriggered);
  }, [riskProfiles]);

  const criticalCount = atRiskStudents.filter((p) => p.riskLevel === 'critical').length;
  const moderateCount = atRiskStudents.filter((p) => p.riskLevel === 'moderate').length;

  if (atRiskStudents.length === 0) {
    return null;
  }

  // Top 3 highest risk students to preview
  const previewStudents = atRiskStudents.slice(0, 3);

  return (
    <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-rose-500/40 relative overflow-hidden transition-all animate-in fade-in duration-300">
      {/* Background glow */}
      <div className="absolute -right-8 -top-8 w-44 h-44 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
              <div className="w-11 h-11 rounded-2xl bg-rose-500/25 border border-rose-400/50 flex items-center justify-center text-rose-300 shadow-inner">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-rose-400 flex items-center gap-1 shadow-xs">
                  <Flame className="w-3 h-3 text-amber-300" />
                  Erken Uyarı Alarmı
                </span>
                <span className="text-xs text-rose-200 font-bold hidden sm:inline">
                  Son 3 Hafta &lt; %50 Performans
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
                <span>Riskli Öğrenci Alarmı</span>
                <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                  {atRiskStudents.length} Öğrenci
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('risk-radar')}
            className="px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span>Tüm Risk Raporunu İncele</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {previewStudents.map((profile) => {
            const std = profile.student;
            const primaryReason = profile.reasons[0];

            return (
              <div
                key={std.id}
                onClick={() => {
                  if (onSelectClass && std.classId) {
                    onSelectClass(std.classId);
                  }
                  onNavigateTab('risk-radar');
                }}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-rose-500/30 rounded-2xl p-3 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-black text-white truncate">
                      {std.name} {std.surname}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold shrink-0">
                      (#{std.number})
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                      profile.riskLevel === 'critical'
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {profile.riskLevel === 'critical' ? 'Kritik' : 'Orta'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-rose-200">
                  {profile.homeworkCompletionRate !== null && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-300" />
                      Ödev: %{profile.homeworkCompletionRate}
                    </span>
                  )}
                  {profile.minusCount3Weeks > 0 && (
                    <span className="flex items-center gap-1 text-rose-300 font-bold">
                      <Zap className="w-3 h-3" />
                      -{profile.minusCount3Weeks} Eksi
                    </span>
                  )}
                </div>

                {primaryReason && (
                  <p className="text-[10px] text-slate-300 line-clamp-1 opacity-90">
                    ⚠️ {primaryReason.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {criticalCount} kritik, {moderateCount} orta seviye takip gerektiren öğrenci bulunuyor.
          </span>
          <button
            onClick={() => onNavigateTab('risk-radar')}
            className="text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
          >
            Veli Bildirimlerini Gönder →
          </button>
        </div>
      </div>
    </div>
  );
};
