import React, { useState, useEffect } from 'react';
import { Student, Quiz, QuizScore, Homework, HomeworkRecord, ClassRoom, HomeworkStatus, User as UserType, AcademicYearConfig, StudentBadge } from '../types';
import { getHomeworkDueDateTimestamp } from '../utils/homeworkUrgencyUtils';
import { isBadgeActive } from '../utils/badgeUtils';
import { HomeworkChecklistModal } from './HomeworkChecklistModal';
import { 
  Award, BookOpen, Plus, Sparkles, Clock, Check, X, Wand2, 
  Edit3, Trash2, AlertTriangle, CheckCircle2, AlertCircle,
  Calendar, User, FileText, RefreshCw, RotateCcw, Flame, ShieldAlert,
  Save, BarChart2, Hash, Printer, FileSpreadsheet, Download
} from 'lucide-react';

interface QuizAndHomeworkViewProps {
  currentClass: ClassRoom;
  students: Student[];
  quizDefinitions: Quiz[];
  quizzes: QuizScore[];
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  initialSubTab?: 'quizzes' | 'homeworks';
  initialHomeworkId?: string;
  initialQuizId?: string;
  hideSubTabs?: boolean;
  currentUser?: UserType;
  academicYearConfig?: AcademicYearConfig;
  onAddQuizDefinition: (quiz: Omit<Quiz, 'id'>) => Quiz;
  onUpdateQuizDefinition: (quiz: Quiz) => void;
  onSoftDeleteQuizDefinition: (quizId: string) => void;
  onRestoreQuizDefinition: (quizId: string) => void;
  onPermanentDeleteQuizDefinition: (quizId: string) => void;
  onSaveQuizScore: (score: Omit<QuizScore, 'id'>) => void;
  onBatchSaveQuizScores: (scores: Omit<QuizScore, 'id'>[]) => void;
  onAddHomework: (hw: Omit<Homework, 'id'>) => void;
  onUpdateHomework: (hw: Homework) => void;
  onSoftDeleteHomework: (hwId: string) => void;
  onRestoreHomework: (hwId: string) => void;
  onPermanentDeleteHomework: (hwId: string) => void;
  onUpdateHomeworkRecord: (record: Omit<HomeworkRecord, 'id'>) => void;
  onBatchUpdateHomeworkRecords: (records: Omit<HomeworkRecord, 'id'>[]) => void;
  badges?: StudentBadge[];
}

export const QuizAndHomeworkView: React.FC<QuizAndHomeworkViewProps> = ({
  currentClass,
  students,
  quizDefinitions,
  quizzes,
  homeworks,
  homeworkRecords,
  initialSubTab = 'quizzes',
  initialHomeworkId,
  initialQuizId,
  hideSubTabs = false,
  currentUser,
  academicYearConfig,
  onAddQuizDefinition,
  onUpdateQuizDefinition,
  onSoftDeleteQuizDefinition,
  onRestoreQuizDefinition,
  onPermanentDeleteQuizDefinition,
  onSaveQuizScore,
  onBatchSaveQuizScores,
  onAddHomework,
  onUpdateHomework,
  onSoftDeleteHomework,
  onRestoreHomework,
  onPermanentDeleteHomework,
  onUpdateHomeworkRecord,
  onBatchUpdateHomeworkRecords,
  badges = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'quizzes' | 'homeworks' | 'trash'>(initialSubTab);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  
  const classStudents = students.filter((s) => s.classId === currentClass.id);
  
  // Active Quiz Definitions (not deleted)
  const classQuizDefs = quizDefinitions.filter((q) => q.classId === currentClass.id && !q.isDeleted);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(classQuizDefs[0]?.id || '');

  // Keep selected quiz synced if list or initialQuizId changes
  useEffect(() => {
    if (initialQuizId && classQuizDefs.some((q) => q.id === initialQuizId)) {
      setSelectedQuizId(initialQuizId);
      return;
    }
    if (classQuizDefs.length > 0) {
      if (!classQuizDefs.some((q) => q.id === selectedQuizId)) {
        setSelectedQuizId(classQuizDefs[0].id);
      }
    } else {
      setSelectedQuizId('');
    }
  }, [quizDefinitions, currentClass.id, initialQuizId]);

  const activeQuiz = classQuizDefs.find((q) => q.id === selectedQuizId) || classQuizDefs[0];

  // Scores input state for selected active quiz
  const [scoresInput, setScoresInput] = useState<{ [studentId: string]: string | number }>({});

  // Sync scores input when activeQuiz or quizzes change
  useEffect(() => {
    if (!activeQuiz) {
      setScoresInput({});
      return;
    }
    const initialScores: { [studentId: string]: string | number } = {};
    classStudents.forEach((std) => {
      const found = quizzes.find(
        (q) => (q.quizId ? q.quizId === activeQuiz.id : q.quizTitle === activeQuiz.title) && q.studentId === std.id
      );
      if (found && found.score !== undefined && found.score !== null) {
        initialScores[std.id] = found.score;
      } else {
        initialScores[std.id] = '';
      }
    });
    setScoresInput(initialScores);
  }, [selectedQuizId, currentClass.id, quizzes]);

  // Quiz Modal States
  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDate, setNewQuizDate] = useState(new Date().toISOString().slice(0, 10));
  const [newQuizDesc, setNewQuizDesc] = useState('');

  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editQuizTitle, setEditQuizTitle] = useState('');
  const [editQuizDate, setEditQuizDate] = useState('');
  const [editQuizDesc, setEditQuizDesc] = useState('');

  // Delete Quiz Safeguard Modal State
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);
  const [deleteQuizStep, setDeleteQuizStep] = useState<1 | 2>(1);
  const [deleteQuizConfirmText, setDeleteQuizConfirmText] = useState('');

  // Quiz Save Feedback Modal State
  const [quizSaveFeedback, setQuizSaveFeedback] = useState<{
    type: 'success' | 'warning';
    title: string;
    message: string;
    savedCount: number;
    emptyCount: number;
  } | null>(null);

  // Homework State
  const classHomeworks = homeworks.filter((h) => h.classId === currentClass.id && !h.isDeleted);
  const [selectedHwId, setSelectedHwId] = useState<string>(classHomeworks[0]?.id || '');

  // Keep selected homework synced if list or initialHomeworkId changes
  useEffect(() => {
    if (initialHomeworkId && classHomeworks.some((h) => h.id === initialHomeworkId)) {
      setSelectedHwId(initialHomeworkId);
      return;
    }
    if (classHomeworks.length > 0) {
      if (!classHomeworks.some((h) => h.id === selectedHwId)) {
        setSelectedHwId(classHomeworks[0].id);
      }
    } else {
      setSelectedHwId('');
    }
  }, [homeworks, currentClass.id, initialHomeworkId]);

  const activeHW = classHomeworks.find((h) => h.id === selectedHwId) || classHomeworks[0];

  // Homework Modals
  const [isAddHWOpen, setIsAddHWOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [editHwTitle, setEditHwTitle] = useState('');
  const [editHwDesc, setEditHwDesc] = useState('');
  const [editHwDueDate, setEditHwDueDate] = useState('');

  // Delete Homework Safeguard Modal State
  const [deletingHw, setDeletingHw] = useState<Homework | null>(null);
  const [deleteHwStep, setDeleteHwStep] = useState<1 | 2>(1);
  const [deleteHwConfirmText, setDeleteHwConfirmText] = useState('');

  // Student Homework & Quiz History Modals
  const [studentHistoryModal, setStudentHistoryModal] = useState<Student | null>(null);
  const [studentQuizHistoryModal, setStudentQuizHistoryModal] = useState<Student | null>(null);

  // Trash Bin State
  const deletedQuizDefs = quizDefinitions.filter((q) => q.isDeleted);
  const deletedHomeworks = homeworks.filter((h) => h.isDeleted);
  const totalDeletedCount = deletedQuizDefs.length + deletedHomeworks.length;
  const [trashSubTab, setTrashSubTab] = useState<'quizzes' | 'homeworks'>('quizzes');

  // Permanent Delete Modal Target
  const [permDeleteTarget, setPermDeleteTarget] = useState<{ type: 'quiz' | 'hw'; item: Quiz | Homework } | null>(null);

  // --- Handlers for Quiz Creation & Editing ---
  const handleOpenAddQuiz = () => {
    const nextNum = classQuizDefs.length + 1;
    setNewQuizTitle(`Quiz ${nextNum}: Kazanım Değerlendirme`);
    setNewQuizDate(new Date().toISOString().slice(0, 10));
    setNewQuizDesc('Ders işlenen konuların kısa kazanım testi');
    setIsAddQuizOpen(true);
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    const created = onAddQuizDefinition({
      classId: currentClass.id,
      title: newQuizTitle.trim(),
      date: newQuizDate,
      description: newQuizDesc.trim(),
      maxScore: 100,
    });

    setSelectedQuizId(created.id);
    setIsAddQuizOpen(false);
  };

  const handleOpenEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditQuizTitle(quiz.title);
    setEditQuizDate(quiz.date);
    setEditQuizDesc(quiz.description || '');
  };

  const handleSaveEditQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz || !editQuizTitle.trim()) return;

    onUpdateQuizDefinition({
      ...editingQuiz,
      title: editQuizTitle.trim(),
      date: editQuizDate,
      description: editQuizDesc.trim(),
    });

    setEditingQuiz(null);
  };

  // --- Handlers for Quiz Soft Delete Safeguard ---
  const handleOpenDeleteQuiz = (quiz: Quiz) => {
    setDeletingQuiz(quiz);
    setDeleteQuizStep(1);
    setDeleteQuizConfirmText('');
  };

  const handleConfirmDeleteQuiz = () => {
    if (!deletingQuiz) return;
    onSoftDeleteQuizDefinition(deletingQuiz.id);
    setDeletingQuiz(null);
    setDeleteQuizStep(1);
    setDeleteQuizConfirmText('');
  };

  // --- Handlers for Quiz Scores ---
  const handleSaveAllQuizScores = () => {
    if (!activeQuiz) return;
    const scoresToSave = classStudents
      .filter((std) => scoresInput[std.id] !== '' && scoresInput[std.id] !== undefined && scoresInput[std.id] !== null)
      .map((std) => ({
        quizId: activeQuiz.id,
        studentId: std.id,
        classId: currentClass.id,
        quizTitle: activeQuiz.title,
        score: Math.min(100, Math.max(0, Number(scoresInput[std.id]))),
        date: activeQuiz.date,
      }));

    if (scoresToSave.length === 0) {
      setQuizSaveFeedback({
        type: 'warning',
        title: 'Not Girişi Bulunamadı',
        message: 'Hiçbir öğrenci için quiz notu yazılmadı. Lütfen en az bir öğrencinin quiz notunu girin veya Hızlı Puan Atama butonlarını kullanın.',
        savedCount: 0,
        emptyCount: classStudents.length,
      });
      return;
    }

    onBatchSaveQuizScores(scoresToSave);
    const emptyCount = classStudents.length - scoresToSave.length;
    setQuizSaveFeedback({
      type: 'success',
      title: 'Quiz Notları Kaydedildi',
      message: emptyCount > 0
        ? `"${activeQuiz.title}" sınavı için ${scoresToSave.length} öğrencinin notu sisteme kaydedildi. (${emptyCount} not girilmeyen öğrenci atlandı.)`
        : `Tüm sınıfın (${scoresToSave.length} öğrenci) "${activeQuiz.title}" not verisi başarıyla sisteme işlendi.`,
      savedCount: scoresToSave.length,
      emptyCount: emptyCount,
    });
  };

  const enteredQuizScoreCount = classStudents.filter(
    (std) => scoresInput[std.id] !== '' && scoresInput[std.id] !== undefined && scoresInput[std.id] !== null
  ).length;

  const handleSetAllScores = (targetScore: number | string) => {
    const updated: { [studentId: string]: number | string } = {};
    classStudents.forEach((std) => {
      updated[std.id] = targetScore;
    });
    setScoresInput(updated);
  };

  // --- Handlers for Homework ---
  const handleGenerateAiHomework = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/suggest-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentClass.subject,
          grade: currentClass.grade,
          topic: 'Dönem Sonu Pekiştirme ve Defter Özet Çalışması',
        }),
      });
      const data = await res.json();
      if (data.text) {
        setHwTitle(`${currentClass.subject} Haftalık Kazanım Ödevi`);
        setHwDesc(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;
    onAddHomework({
      classId: currentClass.id,
      title: hwTitle.trim(),
      description: hwDesc.trim(),
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: hwDueDate,
    });
    setHwTitle('');
    setHwDesc('');
    setIsAddHWOpen(false);
  };

  const handleOpenEditHw = (hw: Homework) => {
    setEditingHw(hw);
    setEditHwTitle(hw.title);
    setEditHwDesc(hw.description || '');
    setEditHwDueDate(hw.dueDate);
  };

  const handleSaveEditHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHw || !editHwTitle.trim()) return;
    onUpdateHomework({
      ...editingHw,
      title: editHwTitle.trim(),
      description: editHwDesc.trim(),
      dueDate: editHwDueDate,
    });
    setEditingHw(null);
  };

  const handleOpenDeleteHw = (hw: Homework) => {
    setDeletingHw(hw);
    setDeleteHwStep(1);
    setDeleteHwConfirmText('');
  };

  const handleConfirmDeleteHW = () => {
    if (!deletingHw) return;
    onSoftDeleteHomework(deletingHw.id);
    setDeletingHw(null);
    setDeleteHwStep(1);
    setDeleteHwConfirmText('');
  };

  const getHomeworkRecordStatus = (hwId: string, studentId: string): HomeworkStatus => {
    const rec = homeworkRecords.find((r) => r.homeworkId === hwId && r.studentId === studentId);
    return rec ? rec.status : 'unmarked';
  };

  const handleBatchSetHwStatus = (status: HomeworkStatus) => {
    if (!activeHW) return;
    const records = classStudents.map((std) => ({
      homeworkId: activeHW.id,
      studentId: std.id,
      status,
      updatedAt: new Date().toISOString().slice(0, 10),
    }));
    onBatchUpdateHomeworkRecords(records);
  };

  // Helper stats for active quiz
  const currentQuizScoresList = classStudents
    .map((std) => scoresInput[std.id])
    .filter((val): val is number => typeof val === 'number' && !isNaN(val));
  const quizAverage = currentQuizScoresList.length > 0
    ? Math.round(currentQuizScoresList.reduce((a, b) => a + b, 0) / currentQuizScoresList.length)
    : '-';
  const highestScore = currentQuizScoresList.length > 0 ? Math.max(...currentQuizScoresList) : '-';
  const lowestScore = currentQuizScoresList.length > 0 ? Math.min(...currentQuizScoresList) : '-';

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Module Header Bar */}
      <div className="bg-white p-3 rounded-2xl shadow-2xs border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        {/* Main Header / Tabs */}
        {!hideSubTabs ? (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl font-bold text-xs">
            <button
              onClick={() => setActiveSubTab('quizzes')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'quizzes'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-indigo-600" />
              Quiz Takip
              <span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.2 text-[10px] rounded-full">
                {classQuizDefs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('homeworks')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'homeworks'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Ödev Takip
              <span className="ml-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.2 text-[10px] rounded-full">
                {classHomeworks.length}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {activeSubTab === 'quizzes' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    Quiz Takip
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {classQuizDefs.length} aktif quiz kayıtlı
                  </p>
                </div>
              </div>
            )}

            {activeSubTab === 'homeworks' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    Ödev Takip
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {classHomeworks.length} aktif ödev kayıtlı
                  </p>
                </div>
              </div>
            )}

            {activeSubTab === 'trash' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab(initialSubTab || 'quizzes')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer mr-1"
                >
                  ← Geri Dön
                </button>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    Çöp Kutusu
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Silinen ögeler
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {activeSubTab === 'quizzes' && (
              <button
                onClick={handleOpenAddQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Yeni Quiz / Sınav</span>
                <span className="sm:hidden">Yeni Quiz</span>
              </button>
            )}

            {activeSubTab === 'homeworks' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-open-checklist-modal"
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer border border-slate-700"
                  title="A4 formatında yazdırılabilir veya indirilebilir ödev kontrol çizelgesi oluştur"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Kontrol Listesi Yazdır</span>
                  <span className="sm:hidden">Çizelge Yazdır</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddHWOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Yeni Ödev Ver</span>
                  <span className="sm:hidden">Yeni Ödev</span>
                </button>
              </div>
            )}
          </div>
      </div>

      {/* ================= QUIZZES TAB ================= */}
      {activeSubTab === 'quizzes' && (
        <div className="space-y-4">
          {/* Quiz Definitions Bar */}
          {classQuizDefs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Henüz Quiz veya Sınav Tanımlanmadı</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Öğrencilerinize sınav notu girmek için öncelikle yukarıdaki buton ile sınav tanımı yapabilirsiniz.
                </p>
              </div>
              <button
                onClick={handleOpenAddQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                İlk Quizi Tanımla
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Defined Quizzes Selector Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {classQuizDefs.map((quiz) => {
                  const isSelected = quiz.id === activeQuiz?.id;
                  const quizScoresList = quizzes.filter((q) => q.quizId === quiz.id || q.quizTitle === quiz.title);
                  const avg = quizScoresList.length > 0
                    ? Math.round(quizScoresList.reduce((acc, s) => acc + s.score, 0) / quizScoresList.length)
                    : null;

                  return (
                    <div
                      key={quiz.id}
                      onClick={() => setSelectedQuizId(quiz.id)}
                      className={`min-w-[220px] p-3 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-900 text-white border-indigo-700 shadow-md scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {quiz.date}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditQuiz(quiz);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                isSelected ? 'hover:bg-indigo-800 text-indigo-200' : 'hover:bg-slate-200 text-slate-500'
                              }`}
                              title="Quiz Bilgilerini Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteQuiz(quiz);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                isSelected ? 'hover:bg-rose-800 text-rose-300' : 'hover:bg-rose-50 text-rose-600'
                              }`}
                              title="Quizi Çöp Kutusuna Taşı"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-xs line-clamp-1">{quiz.title}</h4>
                        {quiz.description && (
                          <p className={`text-[11px] line-clamp-1 mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {quiz.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                          Sınıf Ort.:
                        </span>
                        <span className={`font-black ${
                          isSelected ? 'text-amber-300' : 'text-indigo-600'
                        }`}>
                          {avg !== null ? `${avg} Puan` : 'Girilmedi'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Score Entry Panel for Active Selected Quiz */}
              {activeQuiz && (
                <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-200 space-y-4">
                  {/* Quiz Header & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                          Aktif Quiz
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Tarih: {activeQuiz.date}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-800 mt-1">{activeQuiz.title}</h3>
                      {activeQuiz.description && (
                        <p className="text-xs text-slate-600 mt-0.5">{activeQuiz.description}</p>
                      )}
                    </div>

                    {/* Quiz Performance Stats */}
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="text-center px-2">
                        <p className="text-[10px] text-slate-400 font-medium">Ortalama</p>
                        <p className="font-black text-indigo-600 text-sm">{quizAverage}</p>
                      </div>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <div className="text-center px-2">
                        <p className="text-[10px] text-slate-400 font-medium">En Yüksek</p>
                        <p className="font-black text-emerald-600 text-sm">{highestScore}</p>
                      </div>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <div className="text-center px-2">
                        <p className="text-[10px] text-slate-400 font-medium">En Düşük</p>
                        <p className="font-black text-rose-600 text-sm">{lowestScore}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Score Batch Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                      <span>Hızlı Puan Atama:</span>
                      <button
                        onClick={() => handleSetAllScores(100)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
                      >
                        Tümüne 100
                      </button>
                      <button
                        onClick={() => handleSetAllScores(85)}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[11px] font-bold border border-sky-200 transition-colors"
                      >
                        Tümüne 85
                      </button>
                      <button
                        onClick={() => handleSetAllScores(70)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-200 transition-colors"
                      >
                        Tümüne 70
                      </button>
                      <button
                        onClick={() => handleSetAllScores('')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-300 transition-colors"
                      >
                        Temizle
                      </button>
                    </div>

                    <button
                      onClick={handleSaveAllQuizScores}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Tüm Notları Kaydet
                    </button>
                  </div>

                  {/* Students Score Entry List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {classStudents.map((std) => {
                      const rawVal = scoresInput[std.id];
                      const hasVal = rawVal !== '' && rawVal !== undefined && rawVal !== null;
                      
                      let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
                      let statusText = 'Girilecek';

                      if (hasVal) {
                        const numVal = Number(rawVal);
                        if (numVal < 50) {
                          badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                          statusText = 'Zayıf';
                        } else if (numVal < 70) {
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                          statusText = 'Orta';
                        } else if (numVal < 85) {
                          badgeColor = 'bg-sky-100 text-sky-800 border-sky-200';
                          statusText = 'İyi';
                        } else {
                          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                          statusText = 'Pekiyi';
                        }
                      }

                      return (
                        <div
                          key={std.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-colors"
                        >
                          <div
                            onClick={() => setStudentQuizHistoryModal(std)}
                            className="flex items-center gap-2.5 cursor-pointer group"
                            title="Öğrencinin geçmiş quiz notlarını gör"
                          >
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center overflow-hidden border border-indigo-200 shrink-0">
                              {std.photoUrl ? (
                                <img src={std.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                std.number
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                                {std.name} {std.surname}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-medium">No: {std.number}</span>
                                {(() => {
                                  const stdBadges = badges.filter((b) => b.studentId === std.id && isBadgeActive(b));
                                  if (stdBadges.length === 0) return null;
                                  return (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {stdBadges.map((b) => (
                                        <span
                                          key={b.id}
                                          className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1 py-0.2 rounded font-black flex items-center gap-0.5"
                                          title={b.title}
                                        >
                                          <span>{b.icon || '🏆'}</span>
                                          <span className="whitespace-nowrap">{b.title}</span>
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {statusText}
                            </span>
                            <div className="w-16">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Not"
                                value={scoresInput[std.id] ?? ''}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  if (valStr === '') {
                                    setScoresInput((prev) => ({ ...prev, [std.id]: '' }));
                                  } else {
                                    const num = Math.min(100, Math.max(0, Number(valStr)));
                                    setScoresInput((prev) => ({ ...prev, [std.id]: isNaN(num) ? '' : num }));
                                  }
                                }}
                                className="w-full text-center px-2 py-1 bg-white font-black text-sm text-indigo-700 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:font-normal placeholder:text-slate-300"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= HOMEWORKS TAB ================= */}
      {activeSubTab === 'homeworks' && (
        <div className="space-y-4">
          {classHomeworks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Henüz Ödev Tanımlanmadı</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Sınıfa yeni ödev tanımlayarak öğrencilerin ödev teslim durumlarını takip edebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setIsAddHWOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                İlk Ödevi Tanımla
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Homework Selector List */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {classHomeworks.map((hw) => {
                  const isSelected = hw.id === activeHW?.id;
                  const recs = homeworkRecords.filter((r) => r.homeworkId === hw.id);
                  const completedCount = recs.filter((r) => r.status === 'completed').length;

                  // 24-hour urgency calculation
                  const dueMs = getHomeworkDueDateTimestamp(hw.dueDate);
                  const diffMs = dueMs - Date.now();
                  const isUrgent24h = diffMs > 0 && diffMs <= 24 * 3600 * 1000;
                  const isOverdueToday = diffMs <= 0 && diffMs >= -12 * 3600 * 1000;

                  return (
                    <div
                      key={hw.id}
                      onClick={() => setSelectedHwId(hw.id)}
                      className={`min-w-[240px] p-3 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-900 text-white border-emerald-700 shadow-md scale-[1.02]'
                          : isUrgent24h || isOverdueToday
                          ? 'bg-rose-50/90 hover:bg-rose-100/90 text-slate-800 border-rose-300 ring-2 ring-rose-400/50'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1 gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isUrgent24h || isOverdueToday
                              ? 'bg-rose-600 text-white font-black animate-pulse'
                              : isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(isUrgent24h || isOverdueToday) && <Flame className="w-3 h-3 text-amber-300" />}
                            {isOverdueToday ? 'Bugün Süresi Doldu' : isUrgent24h ? 'Son 24 Saat!' : `Son: ${hw.dueDate}`}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditHw(hw);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                isSelected ? 'hover:bg-emerald-800 text-emerald-200' : 'hover:bg-slate-200 text-slate-500'
                              }`}
                              title="Ödev Bilgilerini Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteHw(hw);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                isSelected ? 'hover:bg-rose-800 text-rose-300' : 'hover:bg-rose-50 text-rose-600'
                              }`}
                              title="Ödevi Çöp Kutusuna Taşı"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-xs line-clamp-1">{hw.title}</h4>
                        <p className={`text-[11px] line-clamp-2 mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                          {hw.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <span className={isSelected ? 'text-emerald-200' : 'text-slate-500'}>
                          Tamamlayan:
                        </span>
                        <span className={`font-black ${
                          isSelected ? 'text-amber-300' : 'text-emerald-600'
                        }`}>
                          {completedCount} / {classStudents.length} Öğrenci
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Homework Control Roster */}
              {activeHW && (
                <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-200 space-y-4">
                  {/* HW Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded-lg">
                          Aktif Ödev Takibi
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Son Teslim: {activeHW.dueDate}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-800 mt-1">{activeHW.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{activeHW.description}</p>
                    </div>

                    {/* Batch Homework Status Buttons */}
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-slate-500 text-[11px]">Tüm Sınıfa Ata:</span>
                      <button
                        onClick={() => handleBatchSetHwStatus('completed')}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 shadow-2xs"
                      >
                        Tümüne Tam (100P)
                      </button>
                      <button
                        onClick={() => handleBatchSetHwStatus('partial')}
                        className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[11px] font-bold hover:bg-amber-600 shadow-2xs"
                      >
                        Tümüne Yarım (50P)
                      </button>
                    </div>
                  </div>

                  {/* Student Homework Roster */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {classStudents.map((std) => {
                      const status = getHomeworkRecordStatus(activeHW.id, std.id);

                      return (
                        <div
                          key={std.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-colors"
                        >
                          <div
                            onClick={() => setStudentHistoryModal(std)}
                            className="flex items-center gap-2.5 cursor-pointer group"
                            title="Öğrencinin tüm ödev özetini ve geçmişini gör"
                          >
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center overflow-hidden border border-emerald-200 shrink-0">
                              {std.photoUrl ? (
                                <img src={std.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                std.number
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                                {std.name} {std.surname}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">No: {std.number}</span>
                            </div>
                          </div>

                          {/* Homework Status Select Buttons */}
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() =>
                                onUpdateHomeworkRecord({
                                  homeworkId: activeHW.id,
                                  studentId: std.id,
                                  status: 'completed',
                                  updatedAt: new Date().toISOString().slice(0, 10),
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                status === 'completed'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              Tam
                            </button>
                            <button
                              onClick={() =>
                                onUpdateHomeworkRecord({
                                  homeworkId: activeHW.id,
                                  studentId: std.id,
                                  status: 'partial',
                                  updatedAt: new Date().toISOString().slice(0, 10),
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                status === 'partial'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              Yarım
                            </button>
                            <button
                              onClick={() =>
                                onUpdateHomeworkRecord({
                                  homeworkId: activeHW.id,
                                  studentId: std.id,
                                  status: 'missing',
                                  updatedAt: new Date().toISOString().slice(0, 10),
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                status === 'missing'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              Eksik
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TRASH BIN TAB (ÇÖP KUTUSU) ================= */}
      {activeSubTab === 'trash' && (
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Çöp Kutusu & Geri Yükleme</h3>
                <p className="text-xs text-slate-500">
                  Silinen quiz veya ödevler burada saklanır. Yanlışlıkla silinen ögeleri geri getirebilirsiniz.
                </p>
              </div>
            </div>

            {/* Trash Sub-tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTrashSubTab('quizzes')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  trashSubTab === 'quizzes'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Silinen Quizler ({deletedQuizDefs.length})
              </button>
              <button
                onClick={() => setTrashSubTab('homeworks')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
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
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Silinen Herhangi Bir Quiz Bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deletedQuizDefs.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRestoreQuizDefinition(q.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Geri Getir
                        </button>

                        <button
                          onClick={() => setPermDeleteTarget({ type: 'quiz', item: q })}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          Kalıcı Olarak Sil
                        </button>
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
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Silinen Herhangi Bir Ödev Bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deletedHomeworks.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRestoreHomework(hw.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Geri Getir
                        </button>

                        <button
                          onClick={() => setPermDeleteTarget({ type: 'hw', item: hw })}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          Kalıcı Olarak Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Add Quiz Modal */}
      {isAddQuizOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Yeni Quiz / Sınav Tanımla
              </h3>
              <button onClick={() => setIsAddQuizOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quiz / Sınav Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Quiz 1: Üslü Sayılar"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sınav Tarihi</label>
                <input
                  type="date"
                  required
                  value={newQuizDate}
                  onChange={(e) => setNewQuizDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Açıklama / Kazanım Konusu</label>
                <textarea
                  rows={2}
                  placeholder="Kazanımlar veya sınav kapsamı hakkında kısa bilgi..."
                  value={newQuizDesc}
                  onChange={(e) => setNewQuizDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddQuizOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Quizi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Quiz Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                Quiz Bilgilerini Düzenle
              </h3>
              <button onClick={() => setEditingQuiz(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuiz} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quiz Başlığı</label>
                <input
                  type="text"
                  required
                  value={editQuizTitle}
                  onChange={(e) => setEditQuizTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sınav Tarihi</label>
                <input
                  type="date"
                  required
                  value={editQuizDate}
                  onChange={(e) => setEditQuizDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={editQuizDesc}
                  onChange={(e) => setEditQuizDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Quiz Safeguard Multi-Step Modal */}
      {deletingQuiz && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-500/20">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                {deleteQuizStep === 1 ? 'Güvenlik Kontrolü (1/2)' : 'Son Onay - Çöp Kutusuna Taşı (2/2)'}
              </h3>
              <button onClick={() => setDeletingQuiz(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteQuizStep === 1 ? (
              <div className="space-y-3 text-xs">
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-2xl flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-0.5">"{deletingQuiz.title}" Quizi Siliniyor</p>
                    <p className="text-slate-600">
                      Bu quizi çöp kutusuna taşımak istediğinize emin misiniz? Sınava ait girilen tüm notlar geçici olarak gizlenecektir.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-700">Önemli Bilgilendirme:</p>
                  <p className="text-slate-500 mt-0.5">
                    Quiz silindikten sonra Çöp Kutusu modülünden dilediğiniz zaman tek tıkla geri yüklenebilir.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingQuiz(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteQuizStep(2)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md"
                  >
                    Devam Et (2/2) ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-700 font-bold">
                  Onaylamak için aşağıdaki kutucuğa <span className="text-rose-600 font-black">SİL</span> yazınız:
                </p>

                <input
                  type="text"
                  placeholder="SİL"
                  value={deleteQuizConfirmText}
                  onChange={(e) => setDeleteQuizConfirmText(e.target.value)}
                  className="w-full text-center tracking-widest font-black uppercase text-sm px-3 py-2 border-2 border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteQuizStep(1)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    disabled={deleteQuizConfirmText.trim().toUpperCase() !== 'SİL'}
                    onClick={handleConfirmDeleteQuiz}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Çöp Kutusuna Taşı
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Add Homework Modal */}
      {isAddHWOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Yeni Ödev Tanımla
              </h3>
              <button onClick={() => setIsAddHWOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ödev Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Üslü Sayılar Çalışma Yaprağı"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Son Teslim Tarihi</label>
                <input
                  type="date"
                  required
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ödev Detayı ve Talimatlar</label>
                <textarea
                  rows={3}
                  placeholder="Sayfa numaraları veya çözülecek soru sayısı..."
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHWOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Ödevi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Homework Modal */}
      {editingHw && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                Ödev Bilgilerini Düzenle
              </h3>
              <button onClick={() => setEditingHw(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHomework} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ödev Başlığı</label>
                <input
                  type="text"
                  required
                  value={editHwTitle}
                  onChange={(e) => setEditHwTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Son Teslim Tarihi</label>
                <input
                  type="date"
                  required
                  value={editHwDueDate}
                  onChange={(e) => setEditHwDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  value={editHwDesc}
                  onChange={(e) => setEditHwDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHw(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Homework Safeguard Modal */}
      {deletingHw && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-500/20">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                {deleteHwStep === 1 ? 'Ödev Silme Kontrolü (1/2)' : 'Son Onay - Çöp Kutusuna Taşı (2/2)'}
              </h3>
              <button onClick={() => setDeletingHw(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteHwStep === 1 ? (
              <div className="space-y-3 text-xs">
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-2xl flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-0.5">"{deletingHw.title}" Ödevi Siliniyor</p>
                    <p className="text-slate-600">
                      Bu ödevi çöp kutusuna taşımak istediğinize emin misiniz? Öğrencilerin ödev kayıtları geçici olarak gizlenecektir.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingHw(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteHwStep(2)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md"
                  >
                    Devam Et (2/2) ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-700 font-bold">
                  Onaylamak için aşağıdaki kutucuğa <span className="text-rose-600 font-black">SİL</span> yazınız:
                </p>

                <input
                  type="text"
                  placeholder="SİL"
                  value={deleteHwConfirmText}
                  onChange={(e) => setDeleteHwConfirmText(e.target.value)}
                  className="w-full text-center tracking-widest font-black uppercase text-sm px-3 py-2 border-2 border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteHwStep(1)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    disabled={deleteHwConfirmText.trim().toUpperCase() !== 'SİL'}
                    onClick={handleConfirmDeleteHW}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Çöp Kutusuna Taşı
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Permanent Delete Modal in Trash Bin */}
      {permDeleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-600">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                Kalıcı Silme Onayı
              </h3>
              <button onClick={() => setPermDeleteTarget(null)} className="text-slate-400 hover:text-slate-600">
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permDeleteTarget.type === 'quiz') {
                    onPermanentDeleteQuizDefinition(permDeleteTarget.item.id);
                  } else {
                    onPermanentDeleteHomework(permDeleteTarget.item.id);
                  }
                  setPermDeleteTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                Komple Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Student Homework History Modal */}
      {studentHistoryModal && (() => {
        let completedCount = 0;
        let partialCount = 0;
        let missingCount = 0;
        let unmarkedCount = 0;

        classHomeworks.forEach((hw) => {
          const recStatus = getHomeworkRecordStatus(hw.id, studentHistoryModal.id);
          if (recStatus === 'completed') completedCount++;
          else if (recStatus === 'partial') partialCount++;
          else if (recStatus === 'missing') missingCount++;
          else unmarkedCount++;
        });

        const totalHW = classHomeworks.length;
        const successRate = totalHW > 0
          ? Math.round(((completedCount * 100 + partialCount * 50) / (totalHW * 100)) * 100)
          : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center overflow-hidden border border-emerald-200 shrink-0">
                    {studentHistoryModal.photoUrl ? (
                      <img src={studentHistoryModal.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      studentHistoryModal.number
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      {studentHistoryModal.name} {studentHistoryModal.surname}
                    </h3>
                    <p className="text-xs text-slate-500">Geçmiş Ödev Performansı & Özet Bilgi</p>
                  </div>
                </div>
                <button onClick={() => setStudentHistoryModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Öğrenci Ödev Başarı & Sayısal Özet Paneli */}
              <div className="space-y-2.5">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Ödev Tamamlama Oranı</p>
                    <p className="text-[11px] text-slate-500">
                      Toplam {totalHW} ödevden {completedCount + partialCount} kadarı teslim edildi
                    </p>
                  </div>
                  <div className="text-right flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-700">%{successRate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200/80">
                    <p className="text-[10px] font-extrabold text-emerald-700 uppercase">Tam</p>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">{completedCount}</p>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200/80">
                    <p className="text-[10px] font-extrabold text-amber-700 uppercase">Yarım</p>
                    <p className="text-xl font-black text-amber-800 mt-0.5">{partialCount}</p>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-200/80">
                    <p className="text-[10px] font-extrabold text-rose-700 uppercase">Eksik</p>
                    <p className="text-xl font-black text-rose-800 mt-0.5">{missingCount}</p>
                  </div>
                  <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-extrabold text-slate-600 uppercase">Bekliyor</p>
                    <p className="text-xl font-black text-slate-700 mt-0.5">{unmarkedCount}</p>
                  </div>
                </div>
              </div>

              {/* Detaylı Ödev Listesi */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Tüm Ödevler ve Teslim Durumları ({totalHW})
                </h4>
                <div className="space-y-2">
                  {classHomeworks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Henüz verilmiş ödev bulunmuyor.</p>
                  ) : (
                    classHomeworks.map((hw) => {
                      const recStatus = getHomeworkRecordStatus(hw.id, studentHistoryModal.id);

                      return (
                        <div key={hw.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-slate-800">{hw.title}</p>
                            <p className="text-[10px] text-slate-400">Son Teslim: {hw.dueDate}</p>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            recStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            recStatus === 'partial' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            recStatus === 'missing' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}>
                            {recStatus === 'completed' ? 'Tam Yapıldı' :
                             recStatus === 'partial' ? 'Yarım Yapıldı' :
                             recStatus === 'missing' ? 'Eksik' : 'Kontrol Edilmedi'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* 9. Student Quiz History Modal */}
      {studentQuizHistoryModal && (() => {
        const studentQuizScores = classQuizDefs
          .map((quiz) => {
            const foundScore = quizzes.find(
              (q) => (q.quizId ? q.quizId === quiz.id : q.quizTitle === quiz.title) && q.studentId === studentQuizHistoryModal.id
            );
            return foundScore ? foundScore.score : null;
          })
          .filter((score): score is number => score !== null);

        const studentAvg =
          studentQuizScores.length > 0
            ? Math.round(studentQuizScores.reduce((acc, curr) => acc + curr, 0) / studentQuizScores.length)
            : null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 font-black text-sm flex items-center justify-center overflow-hidden border border-indigo-200">
                    {studentQuizHistoryModal.photoUrl ? (
                      <img src={studentQuizHistoryModal.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      studentQuizHistoryModal.number
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      {studentQuizHistoryModal.name} {studentQuizHistoryModal.surname}
                    </h3>
                    <p className="text-xs text-slate-500">Geçmiş Quiz Performansı</p>
                    {(() => {
                      const stdBadges = badges.filter((b) => b.studentId === studentQuizHistoryModal.id && isBadgeActive(b));
                      if (stdBadges.length === 0) return null;
                      return (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {stdBadges.map((b) => (
                            <span
                              key={b.id}
                              className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded font-black flex items-center gap-0.5"
                              title={b.title}
                            >
                              <span>{b.icon || '🏆'}</span>
                              <span className="whitespace-nowrap">{b.title}</span>
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <button onClick={() => setStudentQuizHistoryModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Öğrenci Quiz Ortalaması Özeti */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Öğrenci Quiz Ortalaması</p>
                  <p className="text-[11px] text-slate-500">
                    {studentQuizScores.length} / {classQuizDefs.length} Sınav Değerlendirildi
                  </p>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-2xl font-black text-indigo-700">
                    {studentAvg !== null ? `${studentAvg}` : '-'}
                  </span>
                  {studentAvg !== null && <span className="text-xs text-indigo-500 font-bold">/ 100</span>}
                </div>
              </div>

              <div className="space-y-2">
                {classQuizDefs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Henüz quiz/sınav kaydı yok.</p>
                ) : (
                  classQuizDefs.map((quiz) => {
                    const foundScore = quizzes.find(
                      (q) => (q.quizId ? q.quizId === quiz.id : q.quizTitle === quiz.title) && q.studentId === studentQuizHistoryModal.id
                    );
                    const scoreVal = foundScore ? foundScore.score : null;

                    let badgeColor = 'bg-slate-100 text-slate-600';
                    let statusText = 'Not Girilmedi';

                    if (scoreVal !== null) {
                      if (scoreVal < 50) {
                        badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                        statusText = 'Zayıf';
                      } else if (scoreVal < 70) {
                        badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                        statusText = 'Orta';
                      } else if (scoreVal < 85) {
                        badgeColor = 'bg-sky-100 text-sky-800 border-sky-200';
                        statusText = 'İyi';
                      } else {
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        statusText = 'Pekiyi';
                      }
                    }

                    return (
                      <div key={quiz.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{quiz.title}</p>
                          <p className="text-[10px] text-slate-400">Tarih: {quiz.date}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {statusText}
                          </span>
                          <span className="font-black text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                            {scoreVal !== null ? `${scoreVal} Puan` : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Fixed Save Button for Quiz */}
      {activeSubTab === 'quizzes' && activeQuiz && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            type="button"
            onClick={handleSaveAllQuizScores}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xl shadow-indigo-600/30 border-2 border-indigo-400/30 font-bold flex items-center gap-2.5 p-3.5 sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl transition-all cursor-pointer active:scale-95 hover:scale-105 group"
            title="Quiz Notlarını Kaydet"
          >
            <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline font-extrabold text-xs">Notları Kaydet</span>
          </button>
        </div>
      )}

      {/* Save Feedback Modal */}
      {quizSaveFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${
                    quizSaveFeedback.type === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {quizSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{quizSaveFeedback.title}</h4>
                  <p className="text-[11px] text-slate-500 font-bold">{currentClass.name} • {activeQuiz?.title || ''}</p>
                </div>
              </div>
              <button
                onClick={() => setQuizSaveFeedback(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
              {quizSaveFeedback.message}
            </p>

            {quizSaveFeedback.type === 'success' && (
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 block">Kaydedilen Not</span>
                  <span className="text-sm font-black text-emerald-900">{quizSaveFeedback.savedCount} Öğrenci</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Not Girilmeyen</span>
                  <span className="text-sm font-black text-slate-700">{quizSaveFeedback.emptyCount} Öğrenci</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setQuizSaveFeedback(null)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer text-white ${
                quizSaveFeedback.type === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Homework Checklist Print & Export Modal */}
      <HomeworkChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        currentClass={currentClass}
        students={students}
        homeworks={homeworks}
        homeworkRecords={homeworkRecords}
        currentUser={currentUser}
        academicYearConfig={academicYearConfig}
      />
    </div>
  );
};
