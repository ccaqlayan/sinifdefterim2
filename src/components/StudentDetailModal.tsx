import React, { useState, useEffect } from 'react';
import { 
  Student, PerformanceLog, QuizScore, Homework, HomeworkRecord, 
  NotebookControl, WeightSettings, ClassRoom, HomeworkStatus, PlusMinusCategory, NotebookStatus 
} from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { 
  Award, BookOpen, PlusCircle, MinusCircle, Clock, X, Check, 
  CheckCircle2, FileText, Calendar, Phone, Mail, User, BookMarked, Sparkles,
  Edit3, Trash2, Plus, Save, RotateCcw, AlertCircle
} from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentClass: ClassRoom;
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworks?: Homework[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  initialTab?: 'notebook' | 'homework' | 'quiz' | 'plusminus';
  onUpdateNotebookControl?: (control: NotebookControl) => void;
  onDeleteNotebookControl?: (id: string) => void;
  onAddNotebookControl?: (control: Omit<NotebookControl, 'id'>) => void;
  onUpdatePlusMinusLog?: (log: PerformanceLog) => void;
  onDeletePlusMinusLog?: (id: string) => void;
  onAddPlusMinusLog?: (log: Omit<PerformanceLog, 'id'>) => void;
}

const PLUS_MINUS_CATEGORIES: PlusMinusCategory[] = [
  'Ders Katılımı',
  'Ödev Hazırlığı',
  'Sınıf Kuralları',
  'Soru Çözümü',
  'Grup Çalışması',
  'Laboratuvar/Etkinlik',
];

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  currentClass,
  plusMinusLogs,
  quizzes,
  homeworks = [],
  homeworkRecords,
  notebookControls,
  weights,
  initialTab = 'notebook',
  onUpdateNotebookControl,
  onDeleteNotebookControl,
  onAddNotebookControl,
  onUpdatePlusMinusLog,
  onDeletePlusMinusLog,
  onAddPlusMinusLog,
}) => {
  const [activeDetailTab, setActiveDetailTab] = useState<'homework' | 'quiz' | 'plusminus' | 'notebook'>(initialTab);

  // Notebook editing state
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [notebookForm, setNotebookForm] = useState<{
    date: string;
    percentage: number;
    status: NotebookStatus;
    note: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    percentage: 100,
    status: 'full',
    note: '',
  });

  // Plus/Minus editing state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{
    date: string;
    type: 'plus' | 'minus';
    category: PlusMinusCategory;
    note: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    type: 'plus',
    category: 'Ders Katılımı',
    note: '',
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'notebook' | 'plusminus';
    id: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveDetailTab(initialTab);
      setEditingNotebookId(null);
      setEditingLogId(null);
      setDeleteConfirm(null);
    }
  }, [isOpen, initialTab, student?.id]);

  if (!isOpen || !student) return null;

  const score = calculateStudentOverallScore(
    student,
    plusMinusLogs,
    quizzes,
    homeworkRecords,
    notebookControls,
    weights
  );

  const classHomeworks = homeworks.filter((h) => h.classId === currentClass.id && !h.isDeleted);
  const studentQuizzes = quizzes.filter((q) => q.studentId === student.id);
  const studentLogs = plusMinusLogs.filter((p) => p.studentId === student.id && !p.isDeleted);
  const studentNotebooks = notebookControls.filter((n) => n.studentId === student.id && !n.isDeleted);

  // Notebook Handlers
  const handleStartEditNotebook = (nb: NotebookControl) => {
    setEditingNotebookId(nb.id);
    setNotebookForm({
      date: nb.date,
      percentage: nb.percentage,
      status: nb.status,
      note: nb.note || '',
    });
  };

  const handleStartAddNotebook = () => {
    setEditingNotebookId('new');
    setNotebookForm({
      date: new Date().toISOString().slice(0, 10),
      percentage: 100,
      status: 'full',
      note: '',
    });
  };

  const handleSaveNotebook = () => {
    if (!student) return;
    if (editingNotebookId === 'new') {
      if (onAddNotebookControl) {
        onAddNotebookControl({
          studentId: student.id,
          classId: currentClass.id,
          date: notebookForm.date,
          percentage: notebookForm.percentage,
          status: notebookForm.status,
          note: notebookForm.note.trim() || undefined,
        });
      }
    } else if (editingNotebookId) {
      if (onUpdateNotebookControl) {
        onUpdateNotebookControl({
          id: editingNotebookId,
          studentId: student.id,
          classId: currentClass.id,
          date: notebookForm.date,
          percentage: notebookForm.percentage,
          status: notebookForm.status,
          note: notebookForm.note.trim() || undefined,
        });
      }
    }
    setEditingNotebookId(null);
  };

  // Plus/Minus Handlers
  const handleStartEditLog = (log: PerformanceLog) => {
    setEditingLogId(log.id);
    setLogForm({
      date: log.date,
      type: log.type,
      category: (log.category as PlusMinusCategory) || 'Ders Katılımı',
      note: log.note || '',
    });
  };

  const handleStartAddLog = () => {
    setEditingLogId('new');
    setLogForm({
      date: new Date().toISOString().slice(0, 10),
      type: 'plus',
      category: 'Ders Katılımı',
      note: '',
    });
  };

  const handleSaveLog = () => {
    if (!student) return;
    if (editingLogId === 'new') {
      if (onAddPlusMinusLog) {
        onAddPlusMinusLog({
          studentId: student.id,
          classId: currentClass.id,
          date: logForm.date,
          type: logForm.type,
          category: logForm.category,
          note: logForm.note.trim() || undefined,
        });
      }
    } else if (editingLogId) {
      if (onUpdatePlusMinusLog) {
        onUpdatePlusMinusLog({
          id: editingLogId,
          studentId: student.id,
          classId: currentClass.id,
          date: logForm.date,
          type: logForm.type,
          category: logForm.category,
          note: logForm.note.trim() || undefined,
        });
      }
    }
    setEditingLogId(null);
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'notebook' && onDeleteNotebookControl) {
      onDeleteNotebookControl(deleteConfirm.id);
    } else if (deleteConfirm.type === 'plusminus' && onDeletePlusMinusLog) {
      onDeletePlusMinusLog(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src={
                student.photoUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  student.name + ' ' + student.surname
                )}&background=6366f1&color=fff`
              }
              alt={student.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-indigo-200 shadow-2xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                  #{student.number}
                </span>
                <h3 className="text-xs sm:text-base font-black text-slate-900 leading-tight">
                  {student.name} {student.surname}
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                {currentClass.name} ({currentClass.subject}) • Veli: {student.parentName || 'Girilmedi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {/* Overall Score Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white rounded-2xl p-2.5 sm:p-3.5 text-center shadow-md flex items-center justify-between border border-indigo-500/30">
            <div className="text-left">
              <p className="text-[9px] sm:text-[10px] text-indigo-200 font-black uppercase tracking-wider">Genel Dönem Başarı Notu</p>
              <span className="inline-block bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-lg mt-0.5 shadow-xs">
                {score.letterGrade}
              </span>
            </div>
            <div className="text-right flex items-baseline gap-1 bg-white/10 border border-white/20 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl">
              <span className="text-2xl sm:text-3xl font-black text-white">{score.finalScore ?? '-'}</span>
              <span className="text-[10px] sm:text-xs text-indigo-200 font-bold">/100</span>
            </div>
          </div>

          {/* Interactive Criteria Cards (Selectable Tabs) */}
          <div className="space-y-1">
            <label className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-wider block">
              İncelemek İstediğiniz Alanı Seçin:
            </label>

            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {/* Defter Card */}
              <button
                onClick={() => {
                  setActiveDetailTab('notebook');
                  setEditingNotebookId(null);
                }}
                className={`p-1.5 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'notebook'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                    : 'bg-amber-50/80 text-amber-950 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center justify-between gap-0.5">
                  <BookMarked className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[8px] sm:text-[10px] font-bold opacity-80">%{weights.notebookWeight}</span>
                </div>
                <div className="mt-1">
                  <div className="text-[8px] sm:text-[10px] font-extrabold uppercase opacity-90 truncate" title="Defter Düzeni">Defter</div>
                  <div className="text-[10px] sm:text-sm font-black truncate">%{score.notebookAverage}</div>
                </div>
              </button>

              {/* Katılım Card */}
              <button
                onClick={() => {
                  setActiveDetailTab('plusminus');
                  setEditingLogId(null);
                }}
                className={`p-1.5 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'plusminus'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                    : 'bg-emerald-50/80 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between gap-0.5">
                  <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[8px] sm:text-[10px] font-bold opacity-80">%{weights.plusMinusWeight}</span>
                </div>
                <div className="mt-1">
                  <div className="text-[8px] sm:text-[10px] font-extrabold uppercase opacity-90 truncate" title="Derse Katılım">Katılım</div>
                  <div className="text-[10px] sm:text-sm font-black truncate">+{score.plusCount} / -{score.minusCount}</div>
                </div>
              </button>

              {/* Quiz Card */}
              <button
                onClick={() => setActiveDetailTab('quiz')}
                className={`p-1.5 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'quiz'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-300'
                    : 'bg-indigo-50/80 text-indigo-950 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between gap-0.5">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[8px] sm:text-[10px] font-bold opacity-80">%{weights.quizWeight}</span>
                </div>
                <div className="mt-1">
                  <div className="text-[8px] sm:text-[10px] font-extrabold uppercase opacity-90 truncate" title="Quiz / Sınav">Quiz</div>
                  <div className="text-[10px] sm:text-sm font-black truncate">{score.quizAverage}</div>
                </div>
              </button>

              {/* Ödev Card */}
              <button
                onClick={() => setActiveDetailTab('homework')}
                className={`p-1.5 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'homework'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm ring-2 ring-sky-300'
                    : 'bg-sky-50/80 text-sky-950 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <div className="flex items-center justify-between gap-0.5">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[8px] sm:text-[10px] font-bold opacity-80">%{weights.homeworkWeight}</span>
                </div>
                <div className="mt-1">
                  <div className="text-[8px] sm:text-[10px] font-extrabold uppercase opacity-90 truncate" title="Ödev Takip">Ödev</div>
                  <div className="text-[10px] sm:text-sm font-black truncate">%{score.homeworkScore}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Detailed Breakdown Container */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
            {/* 1. DEFTER KONTROL DETAYI & DÜZENLEME */}
            {activeDetailTab === 'notebook' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-black text-amber-900 uppercase">
                      Defter Kontrolleri ({studentNotebooks.length})
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                      Ort: %{score.notebookAverage}
                    </span>
                    {onAddNotebookControl && (
                      <button
                        onClick={handleStartAddNotebook}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title="Geçmiş veya Yeni Defter Kontrolü Ekle"
                      >
                        <Plus className="w-3 h-3" /> Kayıt Ekle
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Defter Ekleme / Düzenleme Formu */}
                {editingNotebookId && (
                  <div className="bg-amber-50/90 border-2 border-amber-400/80 rounded-2xl p-3 space-y-2.5 shadow-sm animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        {editingNotebookId === 'new' ? 'Yeni Geçmiş Defter Kaydı Ekle' : 'Defter Kaydını Düzenle'}
                      </span>
                      <button
                        onClick={() => setEditingNotebookId(null)}
                        className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                      >
                        ✕ İptal
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black text-amber-950 uppercase block mb-1">
                          Kontrol Tarihi
                        </label>
                        <input
                          type="date"
                          value={notebookForm.date}
                          onChange={(e) => setNotebookForm((p) => ({ ...p, date: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-amber-950 uppercase block mb-1">
                          Puan / Yüzde: <span className="text-amber-800 font-extrabold">%{notebookForm.percentage}</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={notebookForm.percentage}
                            onChange={(e) => {
                              const pct = Number(e.target.value);
                              let st: NotebookStatus = 'full';
                              if (pct >= 85) st = 'full';
                              else if (pct >= 40) st = 'partial';
                              else st = 'missing';
                              setNotebookForm((p) => ({ ...p, percentage: pct, status: st }));
                            }}
                            className="w-full accent-amber-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hızlı Durum Butonları */}
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setNotebookForm((p) => ({ ...p, percentage: 100, status: 'full' }))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          notebookForm.percentage === 100
                            ? 'bg-emerald-600 text-white ring-1 ring-emerald-700 shadow-2xs'
                            : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        ✓ Tam (%100)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotebookForm((p) => ({ ...p, percentage: 60, status: 'partial' }))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          notebookForm.percentage === 60
                            ? 'bg-amber-600 text-white ring-1 ring-amber-700 shadow-2xs'
                            : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        ⚡ Eksik (%60)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotebookForm((p) => ({ ...p, percentage: 0, status: 'missing' }))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          notebookForm.percentage === 0
                            ? 'bg-rose-600 text-white ring-1 ring-rose-700 shadow-2xs'
                            : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        ✕ Yok (%0)
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-amber-950 uppercase block mb-1">
                        Öğretmen Notu / Açıklama (İsteğe Bağlı)
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 2 sayfa eksik yazmış, başlıklar düzenli..."
                        value={notebookForm.note}
                        onChange={(e) => setNotebookForm((p) => ({ ...p, note: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingNotebookId(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-amber-200/60 transition-all cursor-pointer"
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={handleSaveNotebook}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Kaydet
                      </button>
                    </div>
                  </div>
                )}

                {studentNotebooks.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    Henüz defter kontrolü kaydedilmemiş.
                  </div>
                ) : (
                  [...studentNotebooks].reverse().map((nb) => (
                    <div
                      key={nb.id}
                      className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-3 space-y-1.5 shadow-2xs transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{nb.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-black rounded-lg ${
                              nb.status === 'full'
                                ? 'bg-emerald-100 text-emerald-800'
                                : nb.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {nb.status === 'full'
                              ? `Tam (%${nb.percentage})`
                              : nb.status === 'partial'
                              ? `Eksik (%${nb.percentage})`
                              : `Yok (%${nb.percentage})`}
                          </span>

                          {/* Edit / Delete Buttons */}
                          {(onUpdateNotebookControl || onDeleteNotebookControl) && (
                            <div className="flex items-center gap-1 ml-1">
                              {onUpdateNotebookControl && (
                                <button
                                  onClick={() => handleStartEditNotebook(nb)}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-all cursor-pointer"
                                  title="Bu Kaydı Düzenle"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteNotebookControl && (
                                <button
                                  onClick={() => setDeleteConfirm({
                                    type: 'notebook',
                                    id: nb.id,
                                    label: `${nb.date} tarihli Defter Kontrolü (%${nb.percentage})`
                                  })}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-all cursor-pointer"
                                  title="Bu Kaydı Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${nb.percentage}%` }}
                          className={`h-full ${
                            nb.percentage >= 80
                              ? 'bg-emerald-500'
                              : nb.percentage >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>

                      {nb.note && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                          <strong>Öğretmen Notu:</strong> {nb.note}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. KATILIM (ARTI/EKSİ) DETAYI & DÜZENLEME */}
            {activeDetailTab === 'plusminus' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-emerald-900 uppercase">
                      Artı / Eksi Kayıtları ({studentLogs.length})
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs font-black">
                      +{score.plusCount}
                    </span>
                    <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 text-xs font-black">
                      -{score.minusCount}
                    </span>
                    {onAddPlusMinusLog && (
                      <button
                        onClick={handleStartAddLog}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title="Geçmiş veya Yeni Artı/Eksi Ekle"
                      >
                        <Plus className="w-3 h-3" /> +/- Ekle
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Artı/Eksi Ekleme / Düzenleme Formu */}
                {editingLogId && (
                  <div className="bg-emerald-50/90 border-2 border-emerald-400/80 rounded-2xl p-3 space-y-2.5 shadow-sm animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                        {editingLogId === 'new' ? 'Yeni Geçmiş Artı / Eksi Ekle' : 'Artı / Eksi Kaydını Düzenle'}
                      </span>
                      <button
                        onClick={() => setEditingLogId(null)}
                        className="text-emerald-800 hover:text-emerald-950 text-xs font-bold"
                      >
                        ✕ İptal
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Tür Seçimi: Artı / Eksi */}
                      <div>
                        <label className="text-[10px] font-black text-emerald-950 uppercase block mb-1">
                          Puan Türü
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLogForm((p) => ({ ...p, type: 'plus' }))}
                            className={`py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              logForm.type === 'plus'
                                ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-400'
                                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            + Artı (+1)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogForm((p) => ({ ...p, type: 'minus' }))}
                            className={`py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              logForm.type === 'minus'
                                ? 'bg-rose-600 text-white shadow-2xs ring-2 ring-rose-400'
                                : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                            }`}
                          >
                            - Eksi (-1)
                          </button>
                        </div>
                      </div>

                      {/* Tarih */}
                      <div>
                        <label className="text-[10px] font-black text-emerald-950 uppercase block mb-1">
                          İşlem Tarihi
                        </label>
                        <input
                          type="date"
                          value={logForm.date}
                          onChange={(e) => setLogForm((p) => ({ ...p, date: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Kategori Seçimi */}
                    <div>
                      <label className="text-[10px] font-black text-emerald-950 uppercase block mb-1">
                        Kategori
                      </label>
                      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                        {PLUS_MINUS_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setLogForm((p) => ({ ...p, category: cat }))}
                            className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              logForm.category === cat
                                ? 'bg-emerald-700 text-white'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Açıklama */}
                    <div>
                      <label className="text-[10px] font-black text-emerald-950 uppercase block mb-1">
                        Açıklama / Not (İsteğe Bağlı)
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Tahtada zor soruyu çözdü, materyal unuttu..."
                        value={logForm.note}
                        onChange={(e) => setLogForm((p) => ({ ...p, note: e.target.value }))}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingLogId(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-emerald-200/60 transition-all cursor-pointer"
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={handleSaveLog}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Kaydet
                      </button>
                    </div>
                  </div>
                )}

                {studentLogs.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    Henüz katılım (artı/eksi) verisi kaydedilmemiş.
                  </div>
                ) : (
                  [...studentLogs].reverse().map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                            log.type === 'plus'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {log.type === 'plus' ? '+' : '-'}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {log.category || (log.type === 'plus' ? 'Derse Etkin Katılım' : 'Derse Hazırlık Eksikliği')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {log.date} {log.note ? `• ${log.note}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                            log.type === 'plus'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {log.type === 'plus' ? '+1 Puan' : '-1 Puan'}
                        </span>

                        {/* Edit / Delete Buttons */}
                        {(onUpdatePlusMinusLog || onDeletePlusMinusLog) && (
                          <div className="flex items-center gap-1 ml-1">
                            {onUpdatePlusMinusLog && (
                              <button
                                onClick={() => handleStartEditLog(log)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-all cursor-pointer"
                                title="Bu Kaydı Düzenle"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeletePlusMinusLog && (
                              <button
                                onClick={() => setDeleteConfirm({
                                  type: 'plusminus',
                                  id: log.id,
                                  label: `${log.date} tarihli ${log.type === 'plus' ? 'Artı (+1)' : 'Eksi (-1)'} (${log.category || 'Katılım'})`
                                })}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-all cursor-pointer"
                                title="Bu Kaydı Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. QUIZ / SINAV DETAYI */}
            {activeDetailTab === 'quiz' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5 uppercase">
                    <Award className="w-4 h-4 text-indigo-600" /> Quiz & Sınav Not Geçmişi ({studentQuizzes.length})
                  </h4>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200">
                    Ortalama: {score.quizAverage}
                  </span>
                </div>

                {studentQuizzes.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    Girilmiş sınav/quiz notu bulunmuyor.
                  </div>
                ) : (
                  studentQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                        <span>{quiz.quizTitle}</span>
                        <span className="text-indigo-600 font-black text-sm">{quiz.score} / 100</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>Tarih: {quiz.date}</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${quiz.score}%` }}
                            className={`h-full ${
                              quiz.score >= 80
                                ? 'bg-emerald-500'
                                : quiz.score >= 50
                                ? 'bg-indigo-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. ÖDEV TAKİP DETAYI */}
            {activeDetailTab === 'homework' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black text-sky-900 flex items-center gap-1.5 uppercase">
                    <BookOpen className="w-4 h-4 text-sky-600" /> Ödev Takip Geçmiş Kayıtları
                  </h4>
                  <span className="text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200">
                    Başarı: %{score.homeworkScore}
                  </span>
                </div>

                {classHomeworks.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    Bu sınıfa tanımlanmış ödev bulunmuyor.
                  </div>
                ) : (
                  classHomeworks.map((hw) => {
                    const rec = homeworkRecords.find(
                      (r) => r.homeworkId === hw.id && r.studentId === student.id
                    );
                    const status: HomeworkStatus = rec ? rec.status : 'unmarked';

                    return (
                      <div
                        key={hw.id}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{hw.title}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Son Teslim: {hw.dueDate}
                          </div>
                        </div>

                        <div>
                          {status === 'completed' && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" /> Tam (100p)
                            </span>
                          )}
                          {status === 'partial' && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg border border-amber-300 flex items-center gap-1">
                              <MinusCircle className="w-3 h-3 text-amber-700" /> Yarım (50p)
                            </span>
                          )}
                          {status === 'missing' && (
                            <span className="px-2 py-1 bg-rose-100 text-rose-800 text-[10px] font-black rounded-lg border border-rose-300 flex items-center gap-1">
                              <X className="w-3 h-3 text-rose-700" /> Eksik (0p)
                            </span>
                          )}
                          {status === 'late' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-[10px] font-black rounded-lg border border-purple-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-700" /> Geç (70p)
                            </span>
                          )}
                          {status === 'unmarked' && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                              İşaretlenmedi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Öğrenci Geçmiş Karnesi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Kaydı Sil</h4>
                <p className="text-[11px] text-slate-500">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-xl border border-slate-200">
              {deleteConfirm.label} kaydını silmek istediğinize emin misiniz?
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
