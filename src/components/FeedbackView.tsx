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
} from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { filterLogsByTerm, filterQuizScoresByTerm, filterNotebookControlsByTerm, getTermLabel } from '../utils/termUtils';
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
  const [activeSubTab, setActiveSubTab] = useState<'message' | 'rules' | 'history'>('message');
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);

  // Trash Bin State
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashSubTab, setTrashSubTab] = useState<'quizzes' | 'homeworks'>('quizzes');
  const [permDeleteTarget, setPermDeleteTarget] = useState<{
    type: 'quiz' | 'hw';
    item: Quiz | Homework;
  } | null>(null);

  const deletedQuizDefs = quizDefinitions.filter(
    (q) => q.isDeleted && (!currentClass || q.classId === currentClass.id)
  );
  const deletedHomeworks = homeworks.filter(
    (hw) => hw.isDeleted && (!currentClass || hw.classId === currentClass.id)
  );
  const totalDeletedCount = deletedQuizDefs.length + deletedHomeworks.length;

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

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Navigation & Action Boxes (Max 2 cols on tablet/desktop, 1 col on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
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
        <div 
          onClick={() => setIsTrashOpen(!isTrashOpen)}
          className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs flex items-center justify-between gap-3 border transition-all cursor-pointer ${
            isTrashOpen 
              ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white border-rose-500/50 ring-2 ring-rose-500/30' 
              : 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white border-rose-500/30 hover:border-rose-400/60'
          }`}
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
                Silinen quiz ve ödevleri incele, geri getir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsTrashOpen(!isTrashOpen);
            }}
            className={`px-3 py-1.5 text-[11px] font-black rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-xs cursor-pointer ${
              isTrashOpen
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isTrashOpen ? 'Gizle' : 'İncele'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Box 6: Veli İletişim & Bildirim Merkezi (En Altta) */}
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

      {/* Unified Trash Bin Panel (Shows when isTrashOpen is true) */}
      {isTrashOpen && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Çöp Kutusu & Geri Yükleme</h3>
                <p className="text-[11px] text-slate-500">
                  Silinen quiz veya ödevler burada saklanır. İstediğiniz ögeyi geri getirebilir veya kalıcı olarak silebilirsiniz.
                </p>
              </div>
            </div>

            {/* Trash Sub-tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTrashSubTab('quizzes')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  trashSubTab === 'quizzes'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Silinen Quizler ({deletedQuizDefs.length})
              </button>
              <button
                type="button"
                onClick={() => setTrashSubTab('homeworks')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  trashSubTab === 'homeworks'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Silinen Ödevler ({deletedHomeworks.length})
              </button>
            </div>
          </div>

          {/* Deleted Quizzes List */}
          {trashSubTab === 'quizzes' && (
            <div>
              {deletedQuizDefs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Silinen Herhangi Bir Quiz Bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deletedQuizDefs.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Silinmiş Quiz
                          </span>
                          <span className="text-xs text-slate-400">Sınav Tarihi: {q.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 mt-1">{q.title}</h4>
                        {q.description && <p className="text-xs text-slate-500">{q.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onRestoreQuizDefinition && (
                          <button
                            type="button"
                            onClick={() => onRestoreQuizDefinition(q.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Geri Getir
                          </button>
                        )}

                        {onPermanentDeleteQuizDefinition && (
                          <button
                            type="button"
                            onClick={() => setPermDeleteTarget({ type: 'quiz', item: q })}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            Kalıcı Sil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deleted Homeworks List */}
          {trashSubTab === 'homeworks' && (
            <div>
              {deletedHomeworks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Silinen Herhangi Bir Ödev Bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deletedHomeworks.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Silinmiş Ödev
                          </span>
                          <span className="text-xs text-slate-400">Son Teslim: {hw.dueDate}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 mt-1">{hw.title}</h4>
                        {hw.description && <p className="text-xs text-slate-500">{hw.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onRestoreHomework && (
                          <button
                            type="button"
                            onClick={() => onRestoreHomework(hw.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Geri Getir
                          </button>
                        )}

                        {onPermanentDeleteHomework && (
                          <button
                            type="button"
                            onClick={() => setPermDeleteTarget({ type: 'hw', item: hw })}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            Kalıcı Sil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Permanent Delete Modal */}
      {permDeleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-600">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                Kalıcı Silme Onayı
              </h3>
              <button onClick={() => setPermDeleteTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-rose-900 text-xs space-y-1">
              <p className="font-bold text-sm">🚨 DİKKAT: Bu İşlem Geri Alınamaz!</p>
              <p>
                <strong>"{permDeleteTarget.item.title}"</strong> {permDeleteTarget.type === 'quiz' ? 'quiz ve bağlı tüm puanlar' : 'ödev ve bağlı tüm kayıtlar'} veritabanından kalıcı olarak silinecektir.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPermDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permDeleteTarget.type === 'quiz') {
                    onPermanentDeleteQuizDefinition?.(permDeleteTarget.item.id);
                  } else {
                    onPermanentDeleteHomework?.(permDeleteTarget.item.id);
                  }
                  setPermDeleteTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                Komple Sil
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* The 3 Unified Sub-Tabs */}
        <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1 font-bold text-xs">
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
            onClick={() => setActiveSubTab('rules')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeSubTab === 'rules'
                ? 'bg-white text-amber-700 font-extrabold shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Bildirim Kuralları</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full hidden sm:inline">
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
