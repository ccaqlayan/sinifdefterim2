import React, { useState } from 'react';
import {
  Homework,
  HomeworkRecord,
  Quiz,
  QuizScore,
  NotebookControl,
  ClassRoom,
  Student,
  NotificationSettingsConfig,
} from '../types';
import { getAllDashboardAlerts } from '../utils/dashboardAlertsUtils';
import { playNotificationAlertSound } from '../utils/audio';
import { DEFAULT_NOTIFICATION_CONFIG } from '../mockData';
import {
  Bell,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Volume2,
  BookOpen,
  FileCheck2,
  Settings,
  HelpCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardAlertsWidgetProps {
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  quizzes?: Quiz[];
  quizScores?: QuizScore[];
  notebookControls?: NotebookControl[];
  classes: ClassRoom[];
  students: Student[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onNavigateTab: (tab: string, itemId?: string) => void;
  onOpenNotificationSettings?: () => void;
  config?: NotificationSettingsConfig;
}

export const DashboardAlertsWidget: React.FC<DashboardAlertsWidgetProps> = ({
  homeworks,
  homeworkRecords,
  quizzes = [],
  quizScores = [],
  notebookControls = [],
  classes,
  students,
  selectedClassId,
  onSelectClass,
  onNavigateTab,
  onOpenNotificationSettings,
  config = DEFAULT_NOTIFICATION_CONFIG,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'homework' | 'quiz' | 'notebook'>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'selected'>('all');

  if (config.showOnDashboard === false) {
    return null;
  }

  // Get alerts for all classes
  const allAlerts = getAllDashboardAlerts(
    homeworks,
    homeworkRecords,
    quizzes,
    quizScores,
    notebookControls,
    classes,
    students,
    filterScope === 'selected' && selectedClassId ? selectedClassId : 'all',
    config
  );

  if (!allAlerts.hasAlerts) {
    return null;
  }

  const handlePlaySound = () => {
    if (config.soundEnabled !== false) {
      playNotificationAlertSound();
    }
    setHasPlayedSound(true);
  };

  const currentClassObj = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-amber-500/40 relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Decorative Background Accents */}
      <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
            </span>
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-amber-300 flex items-center gap-1 shadow-xs">
                <Flame className="w-3 h-3 text-rose-600" />
                Öğretmen Uyarı Merkezi
              </span>
              <span className="text-xs text-amber-200 font-bold hidden sm:inline">
                {config.homeworkDeadlineDays} Günlük Eşikler
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
              <span>İşlem & Not Bekleyen Bildirimler</span>
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                {allAlerts.totalAlertsCount} Uyarı
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenNotificationSettings && (
            <button
              onClick={onOpenNotificationSettings}
              title="Bildirim Gün Eşiklerini Ayarla"
              className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Gün Ayarları</span>
            </button>
          )}

          <button
            onClick={handlePlaySound}
            title="Sesli Uyarı Çal"
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              hasPlayedSound
                ? 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer"
            title={isCollapsed ? 'Genişlet' : 'Daralt'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Category Pills & Class Filter */}
      {!isCollapsed && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
          {/* Category Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              <span>Tümü</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {allAlerts.totalAlertsCount}
              </span>
            </button>

            {allAlerts.homeworkCount > 0 && (
              <button
                onClick={() => setActiveCategory('homework')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'homework'
                    ? 'bg-amber-500 text-white shadow-md scale-102'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Ödevler</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {allAlerts.homeworkCount}
                </span>
              </button>
            )}

            {allAlerts.quizCount > 0 && (
              <button
                onClick={() => setActiveCategory('quiz')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'quiz'
                    ? 'bg-purple-600 text-white shadow-md scale-102'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Quiz Notları</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {allAlerts.quizCount}
                </span>
              </button>
            )}

            {allAlerts.notebookCount > 0 && (
              <button
                onClick={() => setActiveCategory('notebook')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'notebook'
                    ? 'bg-blue-600 text-white shadow-md scale-102'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Defterler</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {allAlerts.notebookCount}
                </span>
              </button>
            )}
          </div>

          {/* Class Filter toggle when multiple classes exist */}
          {classes.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setFilterScope('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  filterScope === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-black/30 text-slate-400 hover:text-white'
                }`}
              >
                Tüm Sınıflar
              </button>
              {selectedClassId && (
                <button
                  onClick={() => setFilterScope('selected')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterScope === 'selected'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-black/30 text-slate-400 hover:text-white'
                  }`}
                >
                  {currentClassObj?.name || 'Aktif Sınıf'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expanded Alert Cards Grid / List */}
      {!isCollapsed && (
        <div className="relative z-10 mt-3.5 space-y-3">
          {/* Section 1: URGENT HOMEWORKS */}
          {(activeCategory === 'all' || activeCategory === 'homework') &&
            allAlerts.urgentHomeworks.map((item) => (
              <div
                key={`hw-${item.id}`}
                className="bg-white/10 backdrop-blur-md border border-amber-500/30 rounded-2xl p-3.5 transition-all hover:bg-white/15 hover:border-amber-400/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs">
                        {item.classRoom?.name || 'Sınıf'} {item.classRoom?.subject ? `(${item.classRoom.subject})` : ''}
                      </span>

                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                          item.daysRemaining <= 0
                            ? 'bg-rose-500 text-white animate-pulse border border-rose-300'
                            : 'bg-amber-300 text-amber-950 border border-amber-400/50'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {item.timeRemainingText}
                      </span>

                      <span className="text-[11px] text-amber-200 font-medium">
                        Teslim: <strong className="text-white">{item.dueDateFormatted}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white line-clamp-1">
                      {item.homework.title}
                    </h4>

                    {item.homework.description && (
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {item.homework.description}
                      </p>
                    )}

                    {/* Progress Bar & Submissions count */}
                    <div className="pt-1 flex items-center gap-3">
                      <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-500 ${
                            item.completionRate >= 80
                              ? 'bg-emerald-400'
                              : item.completionRate >= 40
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${Math.max(5, item.completionRate)}%` }}
                        ></div>
                      </div>

                      <span className="text-[11px] text-amber-100 font-bold shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        {item.submittedCount} / {item.totalStudents} Teslim (%{item.completionRate})
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700">
                    <button
                      onClick={() => {
                        if (item.homework.classId) {
                          onSelectClass(item.homework.classId);
                        }
                        onNavigateTab('homework', item.homework.id);
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Ödevi Kontrol Et
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Section 2: UNGRADED / DELAYED QUIZZES */}
          {(activeCategory === 'all' || activeCategory === 'quiz') &&
            allAlerts.ungradedQuizzes.map((item) => (
              <div
                key={`quiz-${item.id}`}
                className="bg-white/10 backdrop-blur-md border border-purple-500/30 rounded-2xl p-3.5 transition-all hover:bg-white/15 hover:border-purple-400/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-purple-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs">
                        {item.classRoom?.name || 'Sınıf'} {item.classRoom?.subject ? `(${item.classRoom.subject})` : ''}
                      </span>

                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-purple-500 text-white flex items-center gap-1 border border-purple-300">
                        <AlertCircle className="w-3 h-3 text-purple-200" />
                        {item.daysElapsed} Gün Önce Yapıldı
                      </span>

                      <span className="text-[11px] text-purple-200 font-medium">
                        Tarih: <strong className="text-white">{item.quizDateFormatted}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white line-clamp-1">
                      {item.quiz.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-purple-200 pt-0.5 font-medium">
                      <span className="text-amber-300 font-bold">{item.statusText}</span>
                      <span>•</span>
                      <span>{item.gradedCount} / {item.totalStudents} öğrenci puanlandı</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700">
                    <button
                      onClick={() => {
                        if (item.quiz.classId) {
                          onSelectClass(item.quiz.classId);
                        }
                        onNavigateTab('quiz', item.quiz.id);
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Notları Gir
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Section 3: UNGRADED / DELAYED NOTEBOOK CONTROLS */}
          {(activeCategory === 'all' || activeCategory === 'notebook') &&
            allAlerts.ungradedNotebooks.map((item) => (
              <div
                key={`nb-${item.id}`}
                className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-3.5 transition-all hover:bg-white/15 hover:border-blue-400/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-blue-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs">
                        {item.classRoom?.name || 'Sınıf'} {item.classRoom?.subject ? `(${item.classRoom.subject})` : ''}
                      </span>

                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-blue-500 text-white flex items-center gap-1 border border-blue-300">
                        <BookOpen className="w-3 h-3 text-blue-200" />
                        {item.daysElapsed} Gün Önce Kontrol Edildi
                      </span>

                      <span className="text-[11px] text-blue-200 font-medium">
                        Tarih: <strong className="text-white">{item.dateFormatted}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white">
                      Defter Kontrol Notları Girişi
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-blue-200 pt-0.5 font-medium">
                      <span className="text-amber-300 font-bold">{item.statusText}</span>
                      <span>•</span>
                      <span>{item.checkedCount} / {item.totalStudents} öğrenci kontrol edildi</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700">
                    <button
                      onClick={() => {
                        if (item.classId) {
                          onSelectClass(item.classId);
                        }
                        onNavigateTab('notebook');
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Defterleri Puanla
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Quick Footer hint */}
          <div className="pt-1 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Bildirim eşikleri (ödev son 1-3 gün, quiz ve defter gecikmeleri) ayarlardan değiştirilebilir.
            </span>
            {onOpenNotificationSettings && (
              <button
                onClick={onOpenNotificationSettings}
                className="text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
              >
                Eşikleri Özelleştir →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
