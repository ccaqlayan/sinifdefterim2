import React, { useState, useMemo } from 'react';
import {
  Student,
  ClassRoom,
  PerformanceLog,
  Homework,
  HomeworkRecord,
  Quiz,
  QuizScore,
  NotebookControl,
  ParentFeedbackLog,
  StudentRiskProfile,
  RiskLevel,
  RiskReasonCode,
  RiskRadarConfig,
} from '../types';
import {
  calculateStudentRiskProfiles,
  calculateClassRiskSummary,
  generateParentRiskWhatsAppMessage,
  DEFAULT_RISK_RADAR_CONFIG,
} from '../utils/studentRiskUtils';
import { StudentRiskSettingsModal } from './StudentRiskSettingsModal';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Zap,
  Award,
  Send,
  MessageSquare,
  Search,
  Filter,
  Users,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  FileCheck2,
  RefreshCw,
  Plus,
  Minus,
  Settings,
  Sliders,
} from 'lucide-react';

interface StudentRiskRadarViewProps {
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  quizzes?: Quiz[];
  quizScores?: QuizScore[];
  notebookControls?: NotebookControl[];
  teacherName?: string;
  teacherSubject?: string;
  riskConfig?: RiskRadarConfig;
  onSaveRiskConfig?: (updatedConfig: RiskRadarConfig) => void;
  onAddFeedbackLog?: (log: Omit<ParentFeedbackLog, 'id'>) => void;
  onAddPlusMinusLog?: (studentId: string, type: 'plus' | 'minus', category?: any, note?: string) => void;
  onSelectStudentDetail?: (student: Student) => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentRiskRadarView: React.FC<StudentRiskRadarViewProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  plusMinusLogs,
  homeworks,
  homeworkRecords,
  quizzes = [],
  quizScores = [],
  notebookControls = [],
  teacherName,
  teacherSubject,
  riskConfig = DEFAULT_RISK_RADAR_CONFIG,
  onSaveRiskConfig,
  onAddFeedbackLog,
  onAddPlusMinusLog,
  onSelectStudentDetail,
  onNavigateTab,
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'moderate' | 'all_risk' | 'safe'>('all_risk');
  const [filterReason, setFilterReason] = useState<'all' | RiskReasonCode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(selectedClassId || 'all');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // WhatsApp Message Modal State
  const [activeMessageProfile, setActiveMessageProfile] = useState<StudentRiskProfile | null>(null);
  const [customMessageText, setCustomMessageText] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [feedbackSentToast, setFeedbackSentToast] = useState(false);

  // Quick Scoring inline feedback
  const [quickActionSuccessId, setQuickActionSuccessId] = useState<string | null>(null);

  // Calculate all risk profiles
  const allProfiles = useMemo(() => {
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
        classId: selectedClassFilter,
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
    selectedClassFilter,
    riskConfig,
  ]);

  // Summary by class
  const classSummaries = useMemo(() => {
    return calculateClassRiskSummary(classes, allProfiles);
  }, [classes, allProfiles]);

  // Filtered profiles for current view
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((profile) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${profile.student.name} ${profile.student.surname}`.toLowerCase();
        const number = profile.student.number.toLowerCase();
        const className = (profile.classRoom?.name || '').toLowerCase();
        if (!fullName.includes(query) && !number.includes(query) && !className.includes(query)) {
          return false;
        }
      }

      // 2. Risk Level filter
      if (filterLevel === 'critical' && profile.riskLevel !== 'critical') return false;
      if (filterLevel === 'moderate' && profile.riskLevel !== 'moderate') return false;
      if (filterLevel === 'all_risk' && !profile.isRiskTriggered) return false;
      if (filterLevel === 'safe' && profile.riskLevel !== 'safe') return false;

      // 3. Reason Code filter
      if (filterReason !== 'all') {
        const hasReason = profile.reasons.some((r) => r.code === filterReason);
        if (!hasReason) return false;
      }

      return true;
    });
  }, [allProfiles, searchQuery, filterLevel, filterReason]);

  // Aggregate Metrics
  const totalStudentsCount = allProfiles.length;
  const criticalCount = allProfiles.filter((p) => p.riskLevel === 'critical').length;
  const moderateCount = allProfiles.filter((p) => p.riskLevel === 'moderate').length;
  const totalAtRiskCount = criticalCount + moderateCount;
  const homeworkAtRiskCount = allProfiles.filter((p) =>
    p.reasons.some((r) => r.code === 'homework_drop')
  ).length;
  const minusAtRiskCount = allProfiles.filter((p) =>
    p.reasons.some((r) => r.code === 'minus_accumulation')
  ).length;

  // Open WhatsApp Modal
  const handleOpenWhatsAppModal = (profile: StudentRiskProfile) => {
    const text = generateParentRiskWhatsAppMessage(
      profile,
      teacherName || 'Öğretmen',
      teacherSubject || profile.classRoom?.subject
    );
    setActiveMessageProfile(profile);
    setCustomMessageText(text);
  };

  // Send WhatsApp message
  const handleConfirmSendWhatsApp = () => {
    if (!activeMessageProfile || !customMessageText) return;

    const std = activeMessageProfile.student;
    const phone = std.parentPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone;
    const encodedText = encodeURIComponent(customMessageText);

    // Record feedback log
    if (onAddFeedbackLog) {
      onAddFeedbackLog({
        studentId: std.id,
        parentPhone: std.parentPhone,
        message: customMessageText,
        channel: 'whatsapp',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        sentBy: teacherName || 'Öğretmen',
      });
    }

    setFeedbackSentToast(true);
    setTimeout(() => setFeedbackSentToast(false), 3000);

    // Open WhatsApp
    window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
    setActiveMessageProfile(null);
  };

  // Quick plus/minus action
  const handleQuickAddPoint = (studentId: string, type: 'plus' | 'minus') => {
    if (onAddPlusMinusLog) {
      onAddPlusMinusLog(
        studentId,
        type,
        'Ders Katılımı',
        type === 'plus' ? 'Risk takip panelinden teşvik artısı verildi' : 'Risk takip panelinden uyarı eksisi verildi'
      );
      setQuickActionSuccessId(studentId + '-' + type);
      setTimeout(() => setQuickActionSuccessId(null), 2000);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {feedbackSentToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Veli bilgilendirme mesajı sisteme kaydedildi ve WhatsApp açıldı.</span>
        </div>
      )}

      {/* Hero Warning Radar Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-rose-500/40 relative overflow-hidden">
        {/* Glow accents */}
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-rose-400 flex items-center gap-1 shadow-xs">
                <Flame className="w-3 h-3 text-amber-300" />
                Erken Müdahale & Uyarı Radarı
              </span>
              <span className="text-xs text-rose-200 font-bold flex items-center gap-1 bg-black/30 px-2.5 py-0.5 rounded-full">
                <Calendar className="w-3 h-3 text-rose-300" />
                Son 3 Hafta (21 Günlük Pencere)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-xs bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 border border-rose-400/50 font-black px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-300" />
                <span>Kriterleri Ayarla</span>
              </button>

              <button
                onClick={() => onNavigateTab('dashboard')}
                className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1 rounded-xl transition-all"
              >
                ← Anasayfa Paneline Dön
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>Riskli Öğrenci Alarmı</span>
              <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                {totalAtRiskCount} Öğrenci Alarm Veriyor
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-2xl leading-relaxed">
              Son 3 haftada ödev tamamlama oranı <strong>%50'nin altına düşen</strong>, ders içi <strong>eksi sayısı artan</strong> veya sınav performansı gerileyen öğrencileri otomatik tespit eder.
            </p>
          </div>

          {/* Quick KPI Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-rose-400/30">
              <p className="text-[11px] text-rose-200 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Kritik Risk (&lt; %40)
              </p>
              <p className="text-xl font-black text-rose-300 mt-0.5">
                {criticalCount} <span className="text-xs font-medium text-white/70">öğrenci</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-amber-400/30">
              <p className="text-[11px] text-amber-200 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Orta Risk (&lt; %50)
              </p>
              <p className="text-xl font-black text-amber-300 mt-0.5">
                {moderateCount} <span className="text-xs font-medium text-white/70">öğrenci</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[11px] text-indigo-200 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-300" /> Ödev Sorunlular
              </p>
              <p className="text-xl font-black text-white mt-0.5">
                {homeworkAtRiskCount} <span className="text-xs font-medium text-white/70">öğrenci</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[11px] text-emerald-200 font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-300" /> Katılım / Eksi
              </p>
              <p className="text-xl font-black text-white mt-0.5">
                {minusAtRiskCount} <span className="text-xs font-medium text-white/70">öğrenci</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        {/* Row 1: Class Selection Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedClassFilter === 'all'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Tüm Sınıflar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                {totalAtRiskCount}
              </span>
            </button>

            {classes.map((cls) => {
              const summary = classSummaries.find((s) => s.classId === cls.id);
              const riskInClass = summary?.totalAtRiskCount || 0;
              const isSelected = selectedClassFilter === cls.id;

              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassFilter(cls.id)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cls.name}</span>
                  {riskInClass > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-black/30 text-white' : 'bg-rose-500 text-white font-bold'
                      }`}
                    >
                      {riskInClass}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci adı veya no ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Risk Level & Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterLevel('all_risk')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLevel === 'all_risk'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🚨 Tüm Riskli ({totalAtRiskCount})
            </button>

            <button
              onClick={() => setFilterLevel('critical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLevel === 'critical'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔴 Kritik Risk ({criticalCount})
            </button>

            <button
              onClick={() => setFilterLevel('moderate')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLevel === 'moderate'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🟠 Orta Risk ({moderateCount})
            </button>

            <button
              onClick={() => setFilterLevel('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLevel === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tüm Öğrenciler ({totalStudentsCount})
            </button>
          </div>

          {/* Reason specific filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Neden:</span>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-1 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">Tüm Nedenler</option>
              <option value="homework_drop">📝 Ödev Sorunu (&lt; %50)</option>
              <option value="minus_accumulation">⚡ Eksi & Katılım Sorunu</option>
              <option value="low_quiz_score">📊 Düşük Quiz (&lt; 50)</option>
              <option value="notebook_issue">📖 Defter Eksikliği</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Risk Cards List */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Seçilen Kriterlerde Riskli Öğrenci Bulunmuyor!
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filterLevel === 'all_risk' || filterLevel === 'critical'
              ? 'Tebrikler! Son 3 haftada ödev tamamlama oranı %50 altına düşen veya risk eşiğini aşan öğrenci tespit edilmedi.'
              : 'Filtreleri veya arama kriterlerini sıfırlayarak diğer öğrencileri inceleyebilirsiniz.'}
          </p>
          <button
            onClick={() => {
              setFilterLevel('all');
              setFilterReason('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Tüm Öğrenci Listesini Göster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProfiles.map((profile) => {
            const std = profile.student;
            const isCritical = profile.riskLevel === 'critical';
            const isModerate = profile.riskLevel === 'moderate';
            const isSuccessAction = quickActionSuccessId?.startsWith(std.id);

            return (
              <div
                key={std.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all hover:shadow-md flex flex-col justify-between relative overflow-hidden ${
                  isCritical
                    ? 'border-rose-300 ring-2 ring-rose-100 shadow-xs'
                    : isModerate
                    ? 'border-amber-300 shadow-xs'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isCritical
                      ? 'bg-rose-500'
                      : isModerate
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                ></div>

                <div>
                  {/* Student Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {std.photoUrl ? (
                          <img
                            src={std.photoUrl}
                            alt={`${std.name} ${std.surname}`}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200 shadow-2xs">
                            {std.name[0]}
                            {std.surname[0]}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white font-black text-[9px] px-1.5 py-0.2 rounded-md shadow-2xs">
                          #{std.number}
                        </span>
                      </div>

                      {/* Name & Class */}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                            {std.name} {std.surname}
                          </h4>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                            {profile.classRoom?.name || 'Sınıf'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>Veli: <strong>{std.parentName || 'Kayıtlı Veli Yok'}</strong></span>
                          {std.parentPhone && <span className="text-slate-400">({std.parentPhone})</span>}
                        </p>
                      </div>
                    </div>

                    {/* Risk Badge */}
                    <div className="shrink-0 text-right">
                      {isCritical && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 border border-rose-400">
                          <Flame className="w-3 h-3 text-amber-300" />
                          KRİTİK RİSK
                        </span>
                      )}
                      {isModerate && (
                        <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          ORTA RİSK
                        </span>
                      )}
                      {profile.riskLevel === 'safe' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          GÜVENLİ
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        Risk Skoru: %{profile.overallRiskScore}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Row (3-Week Breakdown) */}
                  <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100">
                    {/* 1. Ödev Durumu */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                        <span>3 Haftalık Ödev</span>
                        <span
                          className={`font-black ${
                            profile.homeworkCompletionRate !== null && profile.homeworkCompletionRate < 50
                              ? 'text-rose-600 font-black'
                              : 'text-emerald-600'
                          }`}
                        >
                          {profile.homeworkCompletionRate !== null ? `%${profile.homeworkCompletionRate}` : 'Ödev Yok'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            profile.homeworkCompletionRate !== null && profile.homeworkCompletionRate < 50
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(8, profile.homeworkCompletionRate || 0)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {profile.homeworkCompleted}/{profile.homeworkTotal} Teslim
                        {profile.homeworkMissing > 0 && (
                          <span className="text-rose-600 font-bold ml-1">({profile.homeworkMissing} eksik)</span>
                        )}
                      </p>
                    </div>

                    {/* 2. Ders İçi Katılım & Eksi */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                        <span>Katılım / Puan</span>
                        <span
                          className={`font-black ${
                            profile.netPlusMinus3Weeks < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          Net: {profile.netPlusMinus3Weeks >= 0 ? '+' : ''}{profile.netPlusMinus3Weeks}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                          +{profile.plusCount3Weeks}
                        </span>
                        <span
                          className={`text-[11px] font-black px-1.5 py-0.2 rounded-md ${
                            profile.minusCount3Weeks > 0
                              ? 'text-rose-700 bg-rose-100 font-black'
                              : 'text-slate-500 bg-slate-100'
                          }`}
                        >
                          -{profile.minusCount3Weeks}
                        </span>
                      </div>
                    </div>

                    {/* 3. Quiz / Sınav Notu */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                        <span>3 Haftalık Quiz</span>
                        <span
                          className={`font-black ${
                            profile.quizAverage3Weeks !== null && profile.quizAverage3Weeks < 50
                              ? 'text-rose-600'
                              : 'text-indigo-600'
                          }`}
                        >
                          {profile.quizAverage3Weeks !== null ? `${profile.quizAverage3Weeks}/100` : 'Sınav Yok'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate pt-1">
                        {profile.quizCount3Weeks > 0 ? `${profile.quizCount3Weeks} sınav notu` : 'Kayıt bulunmuyor'}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic Reasons Tag List */}
                  {profile.reasons.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        Tespit Edilen Risk Sebepleri:
                      </p>
                      <div className="space-y-1">
                        {profile.reasons.map((reason, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
                              reason.severity === 'high'
                                ? 'bg-rose-50 border border-rose-200 text-rose-900 font-bold'
                                : 'bg-amber-50 border border-amber-200 text-amber-900'
                            }`}
                          >
                            <AlertTriangle
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                reason.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                              }`}
                            />
                            <div className="leading-snug">
                              <span className="font-black mr-1">{reason.title}:</span>
                              <span className="text-[11px] font-medium opacity-90">{reason.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pedagogical Recommendation Note */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-950 leading-relaxed font-medium">
                      <strong>Öğretmen Tavsiyesi:</strong> {profile.recommendation}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* Quick Plus / Minus adjustment */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickAddPoint(std.id, 'plus')}
                      title="Teşvik Artısı Ver"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Artı</span>
                    </button>

                    <button
                      onClick={() => handleQuickAddPoint(std.id, 'minus')}
                      title="Uyarı Eksisi Ver"
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-xs font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Eksi</span>
                    </button>
                  </div>

                  {/* Detail & WhatsApp Action */}
                  <div className="flex items-center gap-1.5">
                    {onSelectStudentDetail && (
                      <button
                        onClick={() => onSelectStudentDetail(std)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Profil
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenWhatsAppModal(profile)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Veliye WhatsApp Uyarısı</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Message Preview & Edit Modal */}
      {activeMessageProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Veli Erken Uyarı Bildirimi</h3>
                  <p className="text-xs text-emerald-200 font-medium">
                    {activeMessageProfile.student.name} {activeMessageProfile.student.surname} (#{activeMessageProfile.student.number})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveMessageProfile(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold">Alıcı:</span> {activeMessageProfile.student.parentName || 'Veli'}
                  <span className="text-slate-500 ml-1">({activeMessageProfile.student.parentPhone || 'Telefon yok'})</span>
                </div>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  WhatsApp
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Öğretmen Mesaj Metni (Düzenlenebilir):
                </label>
                <textarea
                  rows={9}
                  value={customMessageText}
                  onChange={(e) => setCustomMessageText(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  Gönderildiğinde veli iletişim günlüğüne otomatik işlenir.
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customMessageText);
                    setCopiedToast(true);
                    setTimeout(() => setCopiedToast(false), 2000);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToast ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveMessageProfile(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                onClick={handleConfirmSendWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp İle Gönder & Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk Threshold Criteria Settings Modal */}
      <StudentRiskSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={riskConfig}
        onSaveConfig={(updatedConfig) => {
          if (onSaveRiskConfig) {
            onSaveRiskConfig(updatedConfig);
          }
        }}
      />
    </div>
  );
};
