import React, { useState } from 'react';
import {
  Student,
  PerformanceLog,
  QuizScore,
  HomeworkRecord,
  NotebookControl,
  NotificationSetting,
  ParentFeedbackLog,
  ClassRoom,
  WeightSettings,
  AcademicYearConfig,
  Quiz,
  Homework,
  NotificationSettingsConfig,
  DashboardLayoutConfig,
} from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { filterLogsByTerm, filterQuizScoresByTerm, filterNotebookControlsByTerm, getTermLabel } from '../utils/termUtils';
import { getAllDashboardAlerts } from '../utils/dashboardAlertsUtils';
import { DEFAULT_NOTIFICATION_CONFIG } from '../mockData';
import {
  MessageSquare,
  Sparkles,
  Send,
  Bell,
  Settings,
  Share2,
  CheckCircle2,
  Copy,
  Users,
  ArrowRight,
  Calendar,
  Layers,
  History,
  Sliders,
  SlidersHorizontal,
  Search,
  Filter,
  Check,
  Smartphone,
  Mail,
  RefreshCw,
  Clock,
  UserCheck,
  BarChart3,
  Trash2,
  RotateCcw,
  Flame,
  X,
  AlertTriangle,
  Footprints,
  ShieldAlert,
  Volume2,
  VolumeX,
  BookOpen,
  FileCheck2,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Monitor,
} from 'lucide-react';

interface FeedbackViewProps {
  currentClass?: ClassRoom;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  notifications: NotificationSetting[];
  onUpdateNotifications: (notifications: NotificationSetting[]) => void;
  feedbackLogs: ParentFeedbackLog[];
  onAddFeedbackLog: (log: Omit<ParentFeedbackLog, 'id'>) => void;
  academicYearConfig: AcademicYearConfig;
  quizDefinitions?: Quiz[];
  homeworks?: Homework[];
  onRestoreQuizDefinition?: (id: string) => void;
  onPermanentDeleteQuizDefinition?: (id: string) => void;
  onRestoreHomework?: (id: string) => void;
  onPermanentDeleteHomework?: (id: string) => void;
  onOpenAcademicSettings?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenAddClassModal?: () => void;
  auditLogsCount?: number;
  notificationConfig?: NotificationSettingsConfig;
  onUpdateNotificationConfig?: (config: NotificationSettingsConfig) => void;
  onOpenNotificationSettings?: () => void;
  dashboardLayout?: DashboardLayoutConfig;
  onOpenDashboardCustomize?: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  currentClass,
  students,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  weights,
  notifications,
  onUpdateNotifications,
  feedbackLogs,
  onAddFeedbackLog,
  academicYearConfig,
  quizDefinitions = [],
  homeworks = [],
  onRestoreQuizDefinition,
  onPermanentDeleteQuizDefinition,
  onRestoreHomework,
  onPermanentDeleteHomework,
  onOpenAcademicSettings,
  onNavigateTab,
  onOpenAddClassModal,
  auditLogsCount = 0,
  notificationConfig = DEFAULT_NOTIFICATION_CONFIG,
  onUpdateNotificationConfig,
  onOpenNotificationSettings,
  dashboardLayout,
  onOpenDashboardCustomize,
}) => {
  const classStudents = currentClass ? students.filter((s) => s.classId === currentClass.id) : [];

  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const [customTeacherNote, setCustomTeacherNote] = useState('');
  const [generatedAiMessage, setGeneratedAiMessage] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Search & Filter for History
  const [historySearch, setHistorySearch] = useState('');
  const [historyChannelFilter, setHistoryChannelFilter] = useState<'all' | 'whatsapp' | 'sms' | 'email'>('all');

  // Unified Sub-tab selector & Collapsible state
  const [activeSubTab, setActiveSubTab] = useState<'message' | 'alerts' | 'rules' | 'history'>('message');
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);

  // Fullscreen state & controller
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  });

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      const doc = document as any;
      const isCurrentlyFull = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isCurrentlyFull) {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Tam ekran geçişinde bir sorun oluştu:', err);
    }
  };

  const deletedNotebooks = notebookControls.filter(
    (n) => n.isDeleted && (!currentClass || n.classId === currentClass.id)
  );
  const deletedPlusMinus = plusMinusLogs.filter(
    (p) => p.isDeleted && (!currentClass || p.classId === currentClass.id)
  );
  const deletedQuizDefs = quizDefinitions.filter(
    (q) => q.isDeleted && (!currentClass || q.classId === currentClass.id)
  );
  const deletedHomeworks = homeworks.filter(
    (hw) => hw.isDeleted && (!currentClass || hw.classId === currentClass.id)
  );
  const totalDeletedCount =
    deletedNotebooks.length + deletedPlusMinus.length + deletedQuizDefs.length + deletedHomeworks.length;

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || classStudents[0];

  // Filter logs for the active term
  const termPlusMinus = filterLogsByTerm(plusMinusLogs, academicYearConfig.activeTermId, academicYearConfig);
  const termQuizzes = filterQuizScoresByTerm(quizzes, academicYearConfig.activeTermId, academicYearConfig);
  const termNotebooks = filterNotebookControlsByTerm(notebookControls, academicYearConfig.activeTermId, academicYearConfig);

  const studentScore = selectedStudent
    ? calculateStudentOverallScore(selectedStudent, termPlusMinus, termQuizzes, homeworkRecords, termNotebooks, weights)
    : null;

  const currentTermLabel = getTermLabel(academicYearConfig.activeTermId, academicYearConfig);

  const handleGenerateMessage = async () => {
    if (!selectedStudent || !studentScore) return;
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/gemini/parent-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: `${selectedStudent.name} ${selectedStudent.surname}`,
          subject: currentClass?.subject || 'Ders',
          termName: currentTermLabel,
          plusCount: studentScore.plusCount,
          minusCount: studentScore.minusCount,
          notebookAvg: studentScore.notebookAverage,
          homeworkRate: studentScore.homeworkScore,
          quizAvg: studentScore.quizAverage,
          finalScore: studentScore.finalScore,
          letterGrade: studentScore.letterGrade,
          customNote: customTeacherNote,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setGeneratedAiMessage(data.text);
      } else {
        throw new Error('No text returned');
      }
    } catch (e) {
      console.error(e);
      // Clean fallback template
      const fallbackText = `Sayın Velimiz, ${selectedStudent.name}'in ${academicYearConfig.academicYear} ${currentTermLabel} ${
        currentClass?.subject || 'Ders'
      } dersi performans değerlendirmesi:\n` +
        `• Derse Katılım: +${studentScore.plusCount} / -${studentScore.minusCount}\n` +
        `• Defter Düzeni: ${studentScore.notebookAverage !== null ? `%${studentScore.notebookAverage}` : 'Veri Yok'}\n` +
        `• Quiz/Sınav Ortalaması: ${studentScore.quizAverage !== null ? `${studentScore.quizAverage}/100` : 'Veri Yok'}\n` +
        `• Ödev Başarısı: ${studentScore.homeworkScore !== null ? `%${studentScore.homeworkScore}` : 'Veri Yok'}\n` +
        (customTeacherNote ? `• Öğretmen Notu: ${customTeacherNote}\n` : '') +
        `Öğrencimizin gayretlerinin devamını diler, iş birliğiniz için teşekkür ederiz.`;
      setGeneratedAiMessage(fallbackText);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSendChannel = (channel: 'whatsapp' | 'sms' | 'email') => {
    if (!selectedStudent || !generatedAiMessage) return;

    onAddFeedbackLog({
      studentId: selectedStudent.id,
      parentPhone: selectedStudent.parentPhone,
      message: generatedAiMessage,
      channel,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sentBy: 'Öğretmen',
    });

    const encodedText = encodeURIComponent(generatedAiMessage);

    if (channel === 'whatsapp') {
      const cleanPhone = selectedStudent.parentPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
    } else if (channel === 'sms') {
      window.open(`sms:${selectedStudent.parentPhone}?body=${encodedText}`, '_blank');
    } else {
      navigator.clipboard.writeText(generatedAiMessage);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleToggleNotificationRule = (ruleId: string) => {
    const updated = notifications.map((n) => (n.id === ruleId ? { ...n, enabled: !n.enabled } : n));
    onUpdateNotifications(updated);
  };

  // Filtered history logs
  const filteredHistory = feedbackLogs.filter((log) => {
    const std = students.find((s) => s.id === log.studentId);
    const fullName = std ? `${std.name} ${std.surname}`.toLowerCase() : '';
    const phone = (log.parentPhone || '').toLowerCase();
    const msg = (log.message || '').toLowerCase();
    const matchesSearch =
      fullName.includes(historySearch.toLowerCase()) ||
      phone.includes(historySearch.toLowerCase()) ||
      msg.includes(historySearch.toLowerCase());

    const matchesChannel = historyChannelFilter === 'all' || log.channel === historyChannelFilter;
    return matchesSearch && matchesChannel;
  });

  const activeWidgetCount = dashboardLayout?.widgets?.filter((w) => w.enabled)?.length ?? 8;
  const totalWidgetCount = dashboardLayout?.widgets?.length ?? 8;

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* 🚀 En Üst Kutucuk: Anasayfayı Özelleştir */}
      {onOpenDashboardCustomize && (
        <div 
          id="btn-settings-customize-dashboard"
          onClick={onOpenDashboardCustomize}
          className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-indigo-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group cursor-pointer hover:border-indigo-400/80 transition-all"
        >
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/30 transition-all"></div>
          
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-md ring-2 ring-indigo-400/20 group-hover:scale-105 transition-transform shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Anasayfayı Özelleştir
                </h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {activeWidgetCount}/{totalWidgetCount} Kart Aktif
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Kişisel Düzen
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Anasayfadaki her kutucuğu açıp kapatın, yukarı-aşağı oklarla sırasını değiştirin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDashboardCustomize();
            }}
            className="self-stretch sm:self-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black rounded-xl transition-all shrink-0 flex items-center justify-center gap-2 shadow-md border border-indigo-400/30 cursor-pointer z-10 active:scale-98"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Özelleştir</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation & Action Boxes (Max 2 cols on tablet/desktop, 1 col on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        {/* Box 0: Tam Ekran Modu (Projeksiyon & Akıllı Tahta) */}
        <div 
          id="card-fullscreen-toggle"
          onClick={handleToggleFullscreen}
          className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border transition-all cursor-pointer ${
            isFullscreen
              ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white border-emerald-500/50 hover:border-emerald-400/80 ring-2 ring-emerald-500/20'
              : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 hover:border-indigo-400/60 hover:ring-2 hover:ring-indigo-500/20'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-transform ${
              isFullscreen 
                ? 'bg-emerald-500 text-slate-950 border-emerald-300' 
                : 'bg-indigo-600/50 text-indigo-200 border-indigo-400/30'
            }`}>
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black truncate text-white">Tam Ekran Modu</h4>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                  isFullscreen 
                    ? 'bg-emerald-400 text-slate-950' 
                    : 'bg-indigo-500/40 text-indigo-200 border border-indigo-400/30'
                }`}>
                  {isFullscreen ? '🟢 Tam Ekran Aktif' : 'Akıllı Tahta / Projeksiyon'}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/90 truncate mt-0.5">
                {isFullscreen
                  ? 'Uygulama tam ekranda çalışıyor. Çıkmak için butona veya ESC tuşuna basın.'
                  : 'Tarayıcı çubuklarını gizleyerek uygulamayı tüm ekrana genişletin'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-toggle-fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFullscreen();
            }}
            className={`px-3 py-1.5 text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 ${
              isFullscreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tam Ekrandan Çık</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tam Ekran Yap</span>
              </>
            )}
          </button>
        </div>

        {/* Box 1: Raporlar ve Karne Notları (En Üstte) */}
        {onNavigateTab && (
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-purple-500/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-600/40 border border-purple-400/40 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-purple-200" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black truncate text-white">Raporlar & Karne Notları</h4>
                <p className="text-[11px] text-purple-200/90 truncate mt-0.5">
                  Dönemsel karne ortalamaları, ağırlık hesapları & Excel
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              İncele <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Box 2: Dönem Ayarları */}
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-amber-500/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-black truncate text-white">Dönem Ayarları</h4>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                  {academicYearConfig.activeTermId === 'term1'
                    ? '1. Dönem'
                    : academicYearConfig.activeTermId === 'term2'
                    ? '2. Dönem'
                    : 'Tüm Yıl'}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 truncate mt-0.5">
                {academicYearConfig.academicYear} Tarih Aralıkları
              </p>
            </div>
          </div>
          {onOpenAcademicSettings && (
            <button
              type="button"
              onClick={onOpenAcademicSettings}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              Ayarla <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Box 3: Sınıf & Öğrenci */}
        {onNavigateTab && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-indigo-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/50 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black truncate text-white">Sınıf & Öğrenci</h4>
                <p className="text-[11px] text-indigo-200/90 truncate mt-0.5">Düzenle, ekle veya nakil yap</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('management')}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              Yönet <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Box 4: Ders Programı */}
        {onNavigateTab && (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-blue-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600/50 border border-blue-400/30 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-200" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black truncate text-white">Ders Programı</h4>
                <p className="text-[11px] text-blue-200/90 truncate mt-0.5">Haftalık ders çizelgesi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('schedule')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              Yönet <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Box 5: Çöp Kutusu & Geri Yükleme */}
        {onNavigateTab && (
          <div 
            onClick={() => onNavigateTab('trash')}
            className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-rose-500/30 hover:border-rose-400/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black truncate text-white">Çöp Kutusu & Geri Yükleme</h4>
                  {totalDeletedCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {totalDeletedCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-rose-200/90 truncate mt-0.5">
                  Silinen defter, artı/eksi, quiz ve ödevleri incele, geri getir
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('trash');
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              İncele <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Box 6: Ayak İzi & Öğretmen İşlem Günlüğü */}
        {onNavigateTab && (
          <div 
            onClick={() => onNavigateTab('footprint')}
            className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-indigo-500/30 hover:border-indigo-400/60 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Footprints className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black truncate text-white">Ayak İzi</h4>
                  {auditLogsCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {auditLogsCount}
                    </span>
                  )}
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                    Denetim Günlüğü
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/90 truncate mt-0.5">
                  Öğretmenin yaptığı tüm işlem, toplu kayıt ve düzenleme geçmişi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('footprint');
              }}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              İncele <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Box 7: Riskli Öğrenci Alarmı & Erken Müdahale Radarı */}
        {onNavigateTab && (
          <div 
            onClick={() => onNavigateTab('risk-radar')}
            className="bg-gradient-to-r from-rose-950 via-slate-950 to-indigo-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-rose-500/40 hover:border-rose-400/70 hover:ring-2 hover:ring-rose-500/30 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white border border-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black truncate text-white">Riskli Öğrenci Alarmı</h4>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500 text-white border border-rose-400">
                    Erken Uyarı
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/90 truncate mt-0.5">
                  Son 3 haftada performansı veya ödev tamamlama oranı %50'nin altına düşen öğrenciler
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('risk-radar');
              }}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              Radarı Aç <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Box 8: Bildirim & Uyarı Ayarları (Ödev, Quiz, Defter Gün Eşikleri) */}
        <div 
          onClick={() => {
            if (onOpenNotificationSettings) {
              onOpenNotificationSettings();
            } else {
              setIsCommunicationOpen(true);
              setActiveSubTab('alerts');
            }
          }}
          className="bg-gradient-to-r from-slate-950 via-amber-950/80 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border border-amber-500/30 hover:border-amber-400/60 hover:ring-2 hover:ring-amber-500/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black truncate text-white">Bildirim & Uyarı Ayarları</h4>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                  Gün Eşikleri
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 truncate mt-0.5">
                Ödev teslim (son 1-3 gün), notsuz quiz & defter kontrolü uyarıları
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenNotificationSettings) {
                onOpenNotificationSettings();
              } else {
                setIsCommunicationOpen(true);
                setActiveSubTab('alerts');
              }
            }}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
          >
            Ayarla <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Box 8: Veli İletişim & Bildirim Merkezi (En Altta) */}
        <div 
          onClick={() => setIsCommunicationOpen(!isCommunicationOpen)}
          className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border transition-all cursor-pointer ${
            isCommunicationOpen 
              ? 'bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border-indigo-400/50 ring-2 ring-indigo-500/30' 
              : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 hover:border-indigo-400/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black truncate text-white">Veli İletişim & Bildirim Merkezi</h4>
              <p className="text-[11px] text-indigo-200/90 truncate mt-0.5">
                Mesaj oluştur, otomatik bildirim kuralları & geçmiş
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommunicationOpen(!isCommunicationOpen);
            }}
            className={`px-3 py-1.5 text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer ${
              isCommunicationOpen
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-indigo-500 hover:bg-indigo-400 text-white'
            }`}
          >
            {isCommunicationOpen ? 'Gizle' : 'Giriş'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Unified Communication Center Panel (Shows when isCommunicationOpen is true) */}
      {isCommunicationOpen && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  Veli İletişim & Bildirim Merkezi
                </h2>
                <p className="text-[11px] text-slate-500">
                  Yapay zeka mesajları, otomatik bildirim kuralları ve gönderim geçmişi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <span>Aktif Dönem:</span>
                <span className="text-indigo-700 font-extrabold">{currentTermLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsCommunicationOpen(false)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-lg transition-all cursor-pointer"
              >
                Kapat ✕
              </button>
            </div>
          </div>

        {/* The 4 Unified Sub-Tabs */}
        <div className="bg-slate-100/90 p-1 rounded-xl flex flex-wrap sm:flex-nowrap gap-1 font-bold text-xs">
          <button
            onClick={() => setActiveSubTab('message')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeSubTab === 'message'
                ? 'bg-white text-indigo-700 font-extrabold shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Yapay Zeka Mesajı</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeSubTab === 'alerts'
                ? 'bg-white text-amber-700 font-extrabold shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Anasayfa & Uyarı Eşikleri</span>
            <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full hidden sm:inline">
              Gün Bazlı
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeSubTab === 'rules'
                ? 'bg-white text-indigo-700 font-extrabold shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Kritik Başarı Kuralları</span>
            <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full hidden sm:inline">
              {notifications.filter((n) => n.enabled).length} Aktif
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeSubTab === 'history'
                ? 'bg-white text-emerald-700 font-extrabold shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Gönderim Geçmişi</span>
            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full hidden sm:inline">
              {feedbackLogs.length}
            </span>
          </button>
        </div>

        {/* SUB-TAB 1: YAPAY ZEKA VELİ MESAJI */}
      {activeSubTab === 'message' && (
        <div className="space-y-4">
          {classStudents.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                {currentClass ? 'Sınıfta Öğrenci Bulunmuyor' : 'Henüz Ekli Bir Sınıfınız Yok'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {currentClass
                  ? 'Veli değerlendirme mesajı oluşturabilmek için lütfen bu sınıfa öğrenci ekleyiniz.'
                  : 'Yapay zeka veli bildirimleri oluşturabilmek için önce bir sınıf ve öğrenci listesi tanımlamalısınız.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {onOpenAddClassModal && (
                  <button
                    onClick={onOpenAddClassModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> + Yeni Sınıf Ekle
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('management')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Sınıf & Öğrenci Yönetimi
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> {currentTermLabel} Veli Geri Bildirimi Hazırla
                </h3>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  {classStudents.length} Öğrenci
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Öğrenci Seçin:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {classStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      #{std.number} {std.name} {std.surname} (Veli: {std.parentName || 'Belirtilmedi'} - {std.parentPhone || 'Tel Yok'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="p-3.5 bg-gradient-to-r from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>{selectedStudent.name} {selectedStudent.surname}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({currentTermLabel} Verileri)</span>
                    </div>
                    {studentScore?.finalScore !== null && (
                      <span className="text-[11px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-lg">
                        Başarı Notu: {studentScore?.finalScore} / 100 ({studentScore?.letterGrade})
                      </span>
                    )}
                  </div>

                  <div className="text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium pt-1 border-t border-indigo-100/60">
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Katılım (+/-)</div>
                      <div className="font-bold text-emerald-700">+{studentScore?.plusCount ?? 0} / -{studentScore?.minusCount ?? 0}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Defter Düzeni</div>
                      <div className="font-bold text-amber-700">
                        {studentScore?.notebookAverage !== null && studentScore?.notebookAverage !== undefined
                          ? `%${studentScore.notebookAverage}`
                          : 'Veri Yok'}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Quiz / Sınav</div>
                      <div className="font-bold text-indigo-700">
                        {studentScore?.quizAverage !== null && studentScore?.quizAverage !== undefined
                          ? `${studentScore.quizAverage}`
                          : 'Veri Yok'}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Ödev Takibi</div>
                      <div className="font-bold text-sky-700">
                        {studentScore?.homeworkScore !== null && studentScore?.homeworkScore !== undefined
                          ? `%${studentScore.homeworkScore}`
                          : 'Veri Yok'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Öğretmen Özel Notu (İsteğe Bağlı Ek Açıklama):
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bu hafta problem çözme hızında çok iyi bir ilerleme kaydetti, tebrik ederiz."
                  value={customTeacherNote}
                  onChange={(e) => setCustomTeacherNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleGenerateMessage}
                disabled={isAiGenerating || !selectedStudent}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isAiGenerating ? 'Gemini Yapay Zeka Mesajı Hazırlıyor...' : 'Gemini AI ile Veli Mesajı Oluştur'}
              </button>
            </div>
          )}

          {/* Generated Message Display & Send Channels */}
          {generatedAiMessage && (
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hazırlanan Veli Bildirim Mesajı:
                </h4>
                {copiedToast && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-in fade-in">
                    Panoya Kopyalandı!
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                {generatedAiMessage}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSendChannel('whatsapp')}
                  className="flex-1 min-w-[140px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> WhatsApp ile Gönder
                </button>

                <button
                  onClick={() => handleSendChannel('sms')}
                  className="flex-1 min-w-[120px] py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" /> SMS ile Gönder
                </button>

                <button
                  onClick={() => handleSendChannel('email')}
                  className="p-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                  title="Metni Kopyala"
                >
                  <Copy className="w-4 h-4" /> Kopyala
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: ANASAYFA & GÜN BAZLI UYARI EŞİKLERİ */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" /> Anasayfa Bildirim & Gün Eşik Ayarları
              </h3>
              {onOpenNotificationSettings && (
                <button
                  type="button"
                  onClick={onOpenNotificationSettings}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" /> Detaylı Modal Aç
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Anasayfa panelinde teslim tarihi yaklaşan ödevler, sınavı üzerinden x gün geçmesine rağmen notu girilmemiş quizler ve kontrolünden x gün geçmiş defterler için otomatik uyarı eşiklerini gün bazında ayarlayın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Ödev Teslim Eşiği */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Ödev Teslim Uyarısı</h4>
                    <span className="text-[10px] text-slate-500">Son Gün Eşiği</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateNotificationConfig) {
                      onUpdateNotificationConfig({
                        ...notificationConfig,
                        homeworkDeadlineEnabled: !notificationConfig.homeworkDeadlineEnabled,
                      });
                    }
                  }}
                  className={`w-10 h-5 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                    notificationConfig.homeworkDeadlineEnabled ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  title={notificationConfig.homeworkDeadlineEnabled ? 'Kapat' : 'Aç'}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-all shadow-xs ${
                      notificationConfig.homeworkDeadlineEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Uyarı Başlama Zamanı:</label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      disabled={!notificationConfig.homeworkDeadlineEnabled}
                      onClick={() => {
                        if (onUpdateNotificationConfig) {
                          onUpdateNotificationConfig({
                            ...notificationConfig,
                            homeworkDeadlineDays: days,
                          });
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        notificationConfig.homeworkDeadlineDays === days
                          ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      } ${!notificationConfig.homeworkDeadlineEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {days} Gün
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Teslim tarihine {notificationConfig.homeworkDeadlineDays} gün veya daha az kalan ödevler vurgulanır.
                </p>
              </div>
            </div>

            {/* 2. Quiz Not Girişi Uyarısı */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Quiz Not Girişi Uyarısı</h4>
                    <span className="text-[10px] text-slate-500">Gecikme Eşiği</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateNotificationConfig) {
                      onUpdateNotificationConfig({
                        ...notificationConfig,
                        quizUngradedAlertEnabled: !notificationConfig.quizUngradedAlertEnabled,
                      });
                    }
                  }}
                  className={`w-10 h-5 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                    notificationConfig.quizUngradedAlertEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  title={notificationConfig.quizUngradedAlertEnabled ? 'Kapat' : 'Aç'}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-all shadow-xs ${
                      notificationConfig.quizUngradedAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Gecikme Süresi Eşiği:</label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      disabled={!notificationConfig.quizUngradedAlertEnabled}
                      onClick={() => {
                        if (onUpdateNotificationConfig) {
                          onUpdateNotificationConfig({
                            ...notificationConfig,
                            quizUngradedDays: days,
                          });
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        notificationConfig.quizUngradedDays === days
                          ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      } ${!notificationConfig.quizUngradedAlertEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {days} Gün
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Quiz tarihinden {notificationConfig.quizUngradedDays} gün sonra not girilmediyse uyarı verilir.
                </p>
              </div>
            </div>

            {/* 3. Defter Kontrolü Not Girişi Uyarısı */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Defter Not Girişi Uyarısı</h4>
                    <span className="text-[10px] text-slate-500">Gecikme Eşiği</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateNotificationConfig) {
                      onUpdateNotificationConfig({
                        ...notificationConfig,
                        notebookUngradedAlertEnabled: !notificationConfig.notebookUngradedAlertEnabled,
                      });
                    }
                  }}
                  className={`w-10 h-5 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                    notificationConfig.notebookUngradedAlertEnabled ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                  title={notificationConfig.notebookUngradedAlertEnabled ? 'Kapat' : 'Aç'}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-all shadow-xs ${
                      notificationConfig.notebookUngradedAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Gecikme Süresi Eşiği:</label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      disabled={!notificationConfig.notebookUngradedAlertEnabled}
                      onClick={() => {
                        if (onUpdateNotificationConfig) {
                          onUpdateNotificationConfig({
                            ...notificationConfig,
                            notebookUngradedDays: days,
                          });
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        notificationConfig.notebookUngradedDays === days
                          ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      } ${!notificationConfig.notebookUngradedAlertEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {days} Gün
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Kontrolden {notificationConfig.notebookUngradedDays} gün sonra not girilmediyse uyarı verilir.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Preferences */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationConfig.soundEnabled}
                  onChange={(e) => {
                    if (onUpdateNotificationConfig) {
                      onUpdateNotificationConfig({
                        ...notificationConfig,
                        soundEnabled: e.target.checked,
                      });
                    }
                  }}
                  className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  {notificationConfig.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  Uyarı Ses Efekti
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationConfig.showOnDashboard}
                  onChange={(e) => {
                    if (onUpdateNotificationConfig) {
                      onUpdateNotificationConfig({
                        ...notificationConfig,
                        showOnDashboard: e.target.checked,
                      });
                    }
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                  Anasayfa Kartında Göster
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateNotificationConfig) {
                    onUpdateNotificationConfig(DEFAULT_NOTIFICATION_CONFIG);
                  }
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Varsayılanlara Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BİLDİRİM KURALLARI */}
      {activeSubTab === 'rules' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-600" /> Otomatik Bildirim & Kritik Eşik Kuralları
            </h3>
            <p className="text-xs text-slate-500">
              Sistem öğrencinin seçili dönemdeki defter tamlık, ödev teslim veya net katılım durumlarına göre otomatik uyarılar üretir.
            </p>
          </div>

          <div className="space-y-2.5">
            {notifications.map((rule) => (
              <div
                key={rule.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-indigo-200 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">{rule.name}</h4>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rule.enabled ? 'Aktif' : 'Devre Dışı'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{rule.template}</p>
                </div>

                <button
                  onClick={() => handleToggleNotificationRule(rule.id)}
                  className={`w-12 h-6 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                    rule.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  title={rule.enabled ? 'Kuralı Kapat' : 'Kuralı Aç'}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-all shadow-xs ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GÖNDERİM GEÇMİŞİ */}
      {activeSubTab === 'history' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" /> Velilere Gönderilen Mesaj Kayıtları ({feedbackLogs.length})
                </h3>
                <p className="text-[11px] text-slate-500">Tüm WhatsApp, SMS ve e-posta bildirim geçmişi</p>
              </div>

              {/* Channel Filter Badges */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setHistoryChannelFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyChannelFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setHistoryChannelFilter('whatsapp')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyChannelFilter === 'whatsapp' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setHistoryChannelFilter('sms')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyChannelFilter === 'sms' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  SMS
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Öğrenci adı, telefon numarası veya mesaj içeriğinde ara..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-1">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-1" />
              <p className="font-bold text-slate-600">Henüz Kayıtlı Gönderim Bulunamadı</p>
              <p className="text-[11px] text-slate-400">
                {historySearch ? 'Arama kriterlerinize uygun mesaj kaydı yok.' : 'Velilere gönderdiğiniz bildirimler burada listelenecektir.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((log) => {
                const std = students.find((s) => s.id === log.studentId);
                return (
                  <div key={log.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {std ? `${std.name} ${std.surname}` : 'Öğrenci'}
                        </span>
                        <span className="text-slate-400">({log.parentPhone})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            log.channel === 'whatsapp'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.channel === 'sms'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.channel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {log.sentAt}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-normal whitespace-pre-line">
                      {log.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
