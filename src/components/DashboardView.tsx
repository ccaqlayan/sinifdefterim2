import React from 'react';
import {
  ClassRoom,
  Student,
  PerformanceLog,
  Quiz,
  QuizScore,
  Homework,
  HomeworkRecord,
  NotebookControl,
  WeightSettings,
  AcademicYearConfig,
  ScheduleConfig,
  ScheduleLesson,
  AnnualPlanItem,
  NotificationSettingsConfig,
  RiskRadarConfig,
  LessonLogNote,
  DashboardLayoutConfig,
  DashboardWidgetId,
} from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { filterLogsByTerm, filterQuizScoresByTerm, filterNotebookControlsByTerm, getTermLabel, getTermDateRangeString, getCurrentAcademicWeek } from '../utils/termUtils';
import { CurrentLessonWidget } from './schedule/CurrentLessonWidget';
import { DashboardAlertsWidget } from './DashboardAlertsWidget';
import { StudentRiskWidget } from './StudentRiskWidget';
import { LastLessonSummaryWidget } from './lessonLog/LastLessonSummaryWidget';
import { getAllDashboardAlerts } from '../utils/dashboardAlertsUtils';
import { DEFAULT_NOTIFICATION_CONFIG } from '../mockData';
import { DEFAULT_DASHBOARD_LAYOUT, normalizeDashboardLayout } from '../utils/dashboardLayoutUtils';
import { motion } from 'motion/react';
import {
  Zap,
  BookMarked,
  BookOpen,
  Award,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Dices,
  Calendar,
  CalendarRange,
  ShieldAlert,
  Flame,
  SlidersHorizontal,
} from 'lucide-react';

interface DashboardViewProps {
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizDefinitions?: Quiz[];
  quizzes: QuizScore[];
  homeworks?: Homework[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  onNavigateTab: (tab: string, itemId?: string) => void;
  onOpenAddStudent: () => void;
  onOpenBulkImport: () => void;
  onOpenLuckyDraw: () => void;
  onOpenAddClassModal?: () => void;
  academicYearConfig?: AcademicYearConfig;
  onOpenAcademicSettings?: () => void;
  scheduleConfig?: ScheduleConfig;
  scheduleLessons?: ScheduleLesson[];
  annualPlanItems?: AnnualPlanItem[];
  onOpenPlanDetail?: (grade: string, classNameTitle: string, week: number) => void;
  onOpenAddHomework?: () => void;
  notificationConfig?: NotificationSettingsConfig;
  onOpenNotificationSettings?: () => void;
  riskConfig?: RiskRadarConfig;
  lessonLogs?: LessonLogNote[];
  onOpenNewLessonLogModal?: (classId?: string, log?: LessonLogNote) => void;
  onToggleLessonLogActionItem?: (logId: string, actionText: string) => void;
  onDeleteLessonLog?: (logId: string) => void;
  layoutConfig?: DashboardLayoutConfig;
  onOpenCustomizeDashboard?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  plusMinusLogs,
  quizDefinitions = [],
  quizzes,
  homeworks = [],
  homeworkRecords,
  notebookControls,
  weights,
  onNavigateTab,
  onOpenAddStudent,
  onOpenBulkImport,
  onOpenLuckyDraw,
  onOpenAddClassModal,
  academicYearConfig,
  onOpenAcademicSettings,
  scheduleConfig,
  scheduleLessons,
  annualPlanItems = [],
  onOpenPlanDetail,
  onOpenAddHomework,
  notificationConfig = DEFAULT_NOTIFICATION_CONFIG,
  onOpenNotificationSettings,
  riskConfig,
  lessonLogs = [],
  onOpenNewLessonLogModal,
  onToggleLessonLogActionItem,
  onDeleteLessonLog,
  layoutConfig,
  onOpenCustomizeDashboard,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = currentClass ? students.filter((s) => s.classId === currentClass.id) : [];

  // Filter logs for the active term
  const activeTerm = academicYearConfig?.activeTermId || 'term2';
  const termLogs = academicYearConfig ? filterLogsByTerm(plusMinusLogs, activeTerm, academicYearConfig) : plusMinusLogs;
  const termQuizzes = academicYearConfig ? filterQuizScoresByTerm(quizzes, activeTerm, academicYearConfig) : quizzes;
  const termNotebooks = academicYearConfig ? filterNotebookControlsByTerm(notebookControls, activeTerm, academicYearConfig) : notebookControls;

  // Latest Lesson Log for current class
  const latestLessonLog = currentClass
    ? [...lessonLogs]
        .filter((l) => l.classId === currentClass.id)
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())[0]
    : null;

  // Overall calculations for active class
  const studentScores = classStudents.map((std) =>
    calculateStudentOverallScore(std, termLogs, termQuizzes, homeworkRecords, termNotebooks, weights)
  );

  const validFinalScores = studentScores.filter((s) => s.finalScore !== null).map((s) => s.finalScore as number);
  const classAvgScore = validFinalScores.length > 0
    ? Math.round((validFinalScores.reduce((acc, s) => acc + s, 0) / validFinalScores.length) * 10) / 10
    : null;

  const totalPlus = studentScores.reduce((acc, s) => acc + s.plusCount, 0);
  const totalMinus = studentScores.reduce((acc, s) => acc + s.minusCount, 0);

  const validNotebooks = studentScores.filter((s) => s.notebookAverage !== null).map((s) => s.notebookAverage as number);
  const notebookAvgPercent = validNotebooks.length > 0
    ? Math.round(validNotebooks.reduce((acc, s) => acc + s, 0) / validNotebooks.length)
    : null;

  const lowNotebookCount = studentScores.filter((s) => s.notebookAverage !== null && s.notebookAverage < 60).length;
  const highPerformers = studentScores.filter((s) => s.finalScore !== null && s.finalScore >= 85).length;

  const activeTermText = academicYearConfig
    ? getTermLabel(academicYearConfig.activeTermId, academicYearConfig)
    : (currentClass?.term || '2025-2026 2. Dönem');

  const resolvedLayout = normalizeDashboardLayout(layoutConfig || DEFAULT_DASHBOARD_LAYOUT);

  // Render individual widget blocks based on ID
  const renderWidget = (widgetId: DashboardWidgetId) => {
    switch (widgetId) {
      case 'current_lesson':
        return (
          <CurrentLessonWidget
            key="current_lesson"
            config={scheduleConfig || {
              periodsPerDay: 10,
              lessonDurationMinutes: 40,
              breakDurationMinutes: 10,
              firstLessonStartTime: '09:00',
              activeDays: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'],
              periodTimes: [],
            }}
            lessons={scheduleLessons || []}
            classes={classes}
            annualPlanItems={annualPlanItems}
            academicYearConfig={academicYearConfig}
            onSelectClass={onSelectClass}
            onNavigateSchedule={() => onNavigateTab('schedule')}
            onOpenPlanDetail={onOpenPlanDetail}
          />
        );

      case 'alerts_banner':
        return (
          <DashboardAlertsWidget
            key="alerts_banner"
            homeworks={homeworks}
            homeworkRecords={homeworkRecords}
            quizzes={quizDefinitions}
            quizScores={quizzes}
            notebookControls={notebookControls}
            classes={classes}
            students={students}
            selectedClassId={selectedClassId}
            onSelectClass={onSelectClass}
            onNavigateTab={onNavigateTab}
            onOpenNotificationSettings={onOpenNotificationSettings}
            config={notificationConfig}
          />
        );

      case 'last_lesson_log':
        if (!currentClass) return null;
        return (
          <LastLessonSummaryWidget
            key="last_lesson_log"
            currentClass={currentClass}
            latestLog={latestLessonLog}
            onOpenNewLogModal={() => {
              if (onOpenNewLessonLogModal) {
                onOpenNewLessonLogModal(currentClass.id);
              }
            }}
            onNavigateToTimeline={() => onNavigateTab('lesson-logs')}
            onToggleActionItem={onToggleLessonLogActionItem}
            onEditLog={(log) => {
              if (onOpenNewLessonLogModal) {
                onOpenNewLessonLogModal(currentClass.id, log);
              }
            }}
            onDeleteLog={onDeleteLessonLog}
          />
        );

      case 'class_hero_summary':
        if (classes.length === 0) {
          return (
            <div key="class_hero_summary" className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Başlangıç Rehberi
                  </span>
                  <span className="text-xs text-indigo-200">Sınıf Defterim</span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Hoş Geldiniz! Henüz Ekli Bir Sınıfınız Bulunmuyor
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-xl leading-relaxed">
                    Öğrenci takibi, canlı artı/eksi puanlama, defter kontrolleri, sınavlar ve yapay zeka veli bildirimlerini kullanabilmek için ilk sınıfınızı ekleyin.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {onOpenAddClassModal && (
                    <button
                      id="btn-dashboard-add-first-class"
                      onClick={onOpenAddClassModal}
                      className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer hover:scale-102"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> + Hemen Yeni Sınıf Ekle
                    </button>
                  )}

                  <button
                    onClick={() => onNavigateTab('management')}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/20 text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-indigo-300" /> Sınıf & Öğrenci Yönetimi
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div key="class_hero_summary" className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-indigo-400/20">
                    {activeTermText}
                  </span>
                  {onOpenAcademicSettings && (
                    <button
                      onClick={onOpenAcademicSettings}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" /> Dönem Değiştir
                    </button>
                  )}
                </div>
                <span className="text-xs text-indigo-200 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Mobil Takip Aktif
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight">{currentClass?.name} ({currentClass?.subject})</h2>
              <p className="text-xs text-indigo-200 mt-0.5">Sınıf Öğrenci Sayısı: <strong className="text-white">{classStudents.length} Öğrenci</strong></p>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <p className="text-[11px] text-indigo-200 font-medium">Sınıf Ortalaması</p>
                  <p className="text-xl font-black text-white mt-0.5">
                    {classAvgScore !== null ? classAvgScore : '-'}{' '}
                    {classAvgScore !== null && <span className="text-xs font-normal opacity-70">/100</span>}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <p className="text-[11px] text-indigo-200 font-medium">Net Artı / Eksi</p>
                  <p className="text-xl font-black text-emerald-300 mt-0.5">+{totalPlus} <span className="text-rose-300 font-bold text-sm">/-{totalMinus}</span></p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <p className="text-[11px] text-indigo-200 font-medium">Defter Tamlık</p>
                  <p className="text-xl font-black text-amber-300 mt-0.5">
                    {notebookAvgPercent !== null ? `%${notebookAvgPercent}` : '-'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <p className="text-[11px] text-indigo-200 font-medium">Pekiyi Seviyesi</p>
                  <p className="text-xl font-black text-sky-300 mt-0.5">{highPerformers} <span className="text-xs font-normal opacity-70">öğrenci</span></p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'class_selector_slider':
        if (classes.length === 0) return null;
        return (
          <div key="class_selector_slider">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sınıflarım</h3>
              <span className="text-[11px] text-slate-500">{classes.length} aktif sınıf</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {classes.map((c) => {
                const isSelected = c.id === selectedClassId;
                const cStudents = students.filter((s) => s.classId === c.id);
                const classAlerts = getAllDashboardAlerts(
                  homeworks,
                  homeworkRecords,
                  quizDefinitions,
                  quizzes,
                  notebookControls,
                  classes,
                  students,
                  c.id,
                  notificationConfig
                );
                const totalClassAlerts = classAlerts.totalAlertsCount;

                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectClass(c.id)}
                    className={`shrink-0 p-3.5 rounded-2xl text-left border transition-all w-36 cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {totalClassAlerts > 0 && (
                      <span className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-xs border border-white flex items-center gap-0.5 animate-pulse">
                        🔔 {totalClassAlerts} Uyarı
                      </span>
                    )}
                    <div className="text-base font-black truncate">{c.name}</div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{c.subject}</div>
                    <div className={`text-[11px] mt-2 font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {cStudents.length} öğrenci
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'student_risk_radar':
        return (
          <StudentRiskWidget
            key="student_risk_radar"
            students={students}
            classes={classes}
            plusMinusLogs={termLogs}
            homeworks={homeworks}
            homeworkRecords={homeworkRecords}
            quizzes={quizDefinitions}
            quizScores={termQuizzes}
            notebookControls={termNotebooks}
            selectedClassId={selectedClassId}
            riskConfig={riskConfig}
            onNavigateTab={onNavigateTab}
            onSelectClass={onSelectClass}
          />
        );

      case 'quick_actions_grid':
        return (
          <div key="quick_actions_grid">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hızlı İşlem Paneli</h3>
              {onOpenCustomizeDashboard && (
                <button
                  type="button"
                  onClick={onOpenCustomizeDashboard}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Düzeni Özelleştir</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Dijital Ders Seyir Defteri & Nerede Kaldık? */}
              <button
                onClick={() => onNavigateTab('lesson-logs')}
                className="p-3.5 bg-gradient-to-br from-indigo-50 via-sky-50/70 to-blue-50/80 hover:from-indigo-100 hover:to-sky-100 border border-indigo-200/90 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 text-white flex items-center justify-center font-bold shadow-xs shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Nerede Kaldık?
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-indigo-900 flex items-center gap-1">
                    Ders Seyir Defteri
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    Ders sonu 20 sn hızlı notları, kalınan sayfa/soru & gelecek ders hatırlatmaları
                  </p>
                </div>
              </button>

              {/* Riskli Öğrenci Alarmı & Erken Müdahale Radarı */}
              <button
                onClick={() => onNavigateTab('risk-radar')}
                className="p-3.5 bg-gradient-to-br from-rose-50 via-red-50/70 to-amber-50/80 hover:from-rose-100 hover:to-amber-100 border border-rose-300/90 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center font-bold shadow-xs shadow-rose-500/20 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-rose-700 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shadow-2xs">
                    <Flame className="w-2.5 h-2.5 text-amber-500" />
                    Erken Uyarı
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-rose-900 flex items-center gap-1">
                    Riskli Öğrenci Alarmı
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    Son 3 haftada ödev veya performansı &lt; %50 olanları tespit et & veliye bildir
                  </p>
                </div>
              </button>

              {/* Kazanımlar / Çıktılar */}
              <button
                onClick={() => {
                  const grade = currentClass?.grade || currentClass?.name.replace(/\D/g, '') || '9';
                  const classNameTitle = currentClass?.name || `${grade}. Sınıf`;
                  const currentWeekNum = getCurrentAcademicWeek(academicYearConfig);
                  if (onOpenPlanDetail) {
                    onOpenPlanDetail(grade, classNameTitle, currentWeekNum);
                  } else if (onOpenAcademicSettings) {
                    onOpenAcademicSettings();
                  }
                }}
                className="p-3.5 bg-gradient-to-br from-purple-50 via-indigo-50/70 to-violet-50/80 hover:from-purple-100 hover:to-violet-100 border border-purple-200/90 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Deftere Yazılacaklar
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-purple-900 flex items-center gap-1">
                    Kazanımlar / Çıktılar
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    Deftere bu hafta yazmanız gereken bilgiler
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('weekly-summary')}
                className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/40 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/90 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Özet & Analiz
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-indigo-900 flex items-center gap-1">
                    Haftalık Özet
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    Haftanın yıldızları, ödev eksikleri ve işlenen ders saati analizi
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('quick-score')}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    Canlı
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">Pratik Artı / Eksi</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">Sınıf esnasında tek tıkla canlı değerlendirme yap</p>
                </div>
              </button>

              <button
                onClick={onOpenLuckyDraw}
                className="p-3.5 bg-gradient-to-br from-fuchsia-50 via-purple-50/70 to-indigo-50/60 hover:from-fuchsia-100 hover:to-indigo-100 border border-fuchsia-200/90 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shadow-fuchsia-500/20 group-hover:scale-105 transition-transform">
                    <Dices className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black text-fuchsia-700 bg-white px-2 py-0.5 rounded-full border border-fuchsia-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Kura
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-fuchsia-900 flex items-center gap-1">
                    Şans Çarkı / Kura
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">Renkli çarkıfelek ile sınıftan rastgele öğrenci seç</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('schedule')}
                className="p-3.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    Çizelge
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-800">Ders Programı</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">Haftalık ders saatleri ve çizelge takvimi</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('notebook')}
                className="p-3.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                    Sürgü
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-amber-800">Defter Kontrolü</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">Yüzdesel slider ile defter durumunu gir</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('quiz-hw')}
                className="p-3.5 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                    Notlar
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-sky-800">Quiz & Ödev Takip</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">Quiz notları gir, ödev kontrolü yap</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="p-3.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    Hesapla
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-indigo-800">Dönem Sonu Puanı</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">Ağırlıklı performans notu & Excel indir</p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'smart_warnings':
        if (lowNotebookCount <= 0) return null;
        return (
          <div key="smart_warnings" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="text-xs font-bold text-amber-900">Defter Kontrolü Uyarısı</h5>
              <p className="text-xs text-amber-800 mt-0.5">
                Bu sınıfta <strong>{lowNotebookCount} öğrenci</strong> defter kontrolünde %60 tamlığın altındadır. Veli İletişim modülünden otomatik bildirim gönderebilirsiniz.
              </p>
              <button
                onClick={() => onNavigateTab('feedback')}
                className="mt-2 text-xs font-black text-amber-900 underline hover:text-amber-950 cursor-pointer"
              >
                Velilere Yapay Zeka Mesajı Gönder →
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Dynamically render widgets in user's customized order */}
      {(resolvedLayout?.widgets || [])
        .filter((w) => w && w.enabled)
        .map((w) => {
          const content = renderWidget(w.id);
          if (!content) return null;
          return (
            <motion.div
              key={w.id}
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {content}
            </motion.div>
          );
        })}
    </div>
  );
};
