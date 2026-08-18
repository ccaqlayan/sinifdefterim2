import React, { useState } from 'react';
import { 
  Student, PerformanceLog, ClassRoom, PlusMinusCategory, 
  QuizScore, Homework, HomeworkRecord, NotebookControl, WeightSettings, StudentBadge 
} from '../types';
import { playScoreSound } from '../utils/audio';
import { isBadgeActive } from '../utils/badgeUtils';
import { StudentDetailModal } from './StudentDetailModal';
import { Plus, Minus, Search, Sparkles, Dices, ExternalLink, CheckSquare, Square, Users, Check } from 'lucide-react';

interface QuickScoreViewProps {
  currentClass: ClassRoom;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  onAddLog: (log: Omit<PerformanceLog, 'id'>) => void;
  onBatchAddLogs?: (
    logs: Omit<PerformanceLog, 'id'>[],
    studentDetails: {
      studentId: string;
      studentName: string;
      studentNumber?: string;
      type: 'plus' | 'minus';
      category: PlusMinusCategory;
      note?: string;
    }[]
  ) => void;
  onUpdateLog?: (log: PerformanceLog) => void;
  onDeleteLog: (id: string) => void;
  onOpenLuckyDraw?: () => void;
  quizzes?: QuizScore[];
  homeworks?: Homework[];
  homeworkRecords?: HomeworkRecord[];
  notebookControls?: NotebookControl[];
  onSaveNotebookControl?: (control: Omit<NotebookControl, 'id'>) => void;
  onUpdateNotebookControl?: (control: NotebookControl) => void;
  onDeleteNotebookControl?: (id: string) => void;
  weights?: WeightSettings;
  badges?: StudentBadge[];
}

const CATEGORIES: PlusMinusCategory[] = [
  'Ders Katılımı',
  'Ödev Hazırlığı',
  'Sınıf Kuralları',
  'Soru Çözümü',
  'Grup Çalışması',
  'Laboratuvar/Etkinlik',
];

export const QuickScoreView: React.FC<QuickScoreViewProps> = ({
  currentClass,
  students,
  plusMinusLogs,
  onAddLog,
  onBatchAddLogs,
  onUpdateLog,
  onDeleteLog,
  onOpenLuckyDraw,
  quizzes = [],
  homeworks = [],
  homeworkRecords = [],
  notebookControls = [],
  onSaveNotebookControl,
  onUpdateNotebookControl,
  onDeleteNotebookControl,
  weights = { homeworkPercent: 30, quizPercent: 40, notebookPercent: 15, plusMinusPercent: 15 },
  badges = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlusMinusCategory>('Ders Katılımı');
  const [noteInput, setNoteInput] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const filteredStudents = students
    .filter((s) => s.classId === currentClass.id)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.number.includes(searchTerm)
    );

  const classStudents = students.filter((s) => s.classId === currentClass.id);

  const handleScore = (studentId: string, type: 'plus' | 'minus') => {
    playScoreSound(type);
    const logData: Omit<PerformanceLog, 'id'> = {
      studentId,
      classId: currentClass.id,
      date: new Date().toISOString().slice(0, 10),
      type,
      category: selectedCategory,
    };
    if (noteInput.trim()) {
      logData.note = noteInput.trim();
    }
    onAddLog(logData);
    // Reset note after scoring
    setNoteInput('');
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === classStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleBulkScore = (type: 'plus' | 'minus') => {
    const targetStudents = classStudents.filter((s) => selectedStudentIds.includes(s.id));
    if (targetStudents.length === 0) return;

    playScoreSound(type);
    const today = new Date().toISOString().slice(0, 10);
    const logsToCreate: Omit<PerformanceLog, 'id'>[] = targetStudents.map((std) => ({
      studentId: std.id,
      classId: currentClass.id,
      date: today,
      type,
      category: selectedCategory,
      note: noteInput.trim() ? noteInput.trim() : undefined,
    }));

    const details = targetStudents.map((std) => ({
      studentId: std.id,
      studentName: `${std.name} ${std.surname}`,
      studentNumber: std.number,
      type,
      category: selectedCategory,
      note: noteInput.trim() ? noteInput.trim() : undefined,
    }));

    if (onBatchAddLogs) {
      onBatchAddLogs(logsToCreate, details);
    } else {
      logsToCreate.forEach((l) => onAddLog(l));
    }

    setBulkFeedback(
      `${targetStudents.length} öğrenciye toplu "${selectedCategory}" ${type === 'plus' ? 'Artı (+1)' : 'Eksi (-1)'} kaydedildi.`
    );
    setNoteInput('');
    setTimeout(() => setBulkFeedback(null), 4000);
  };

  const getStudentPlusMinusCount = (studentId: string) => {
    const logs = plusMinusLogs.filter((l) => l.studentId === studentId && !l.isDeleted);
    const plus = logs.filter((l) => l.type === 'plus').length;
    const minus = logs.filter((l) => l.type === 'minus').length;
    return { plus, minus, total: plus - minus };
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Category Selection Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Katılım Kategorisi
          </label>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {selectedCategory}
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Optional Note Field for next score click */}
        <input
          type="text"
          placeholder="İsteğe bağlı hızlı açıklama (örn: Derse kalktı, materyali unuttu)..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Student Search & Quick Counter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Öğrenci adı veya numarası ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
          />
        </div>

        {/* Bulk Scoring Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            if (!isBulkMode) {
              setSelectedStudentIds(classStudents.map((s) => s.id));
            } else {
              setSelectedStudentIds([]);
            }
            setIsBulkMode(!isBulkMode);
          }}
          className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
            isBulkMode
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="Tüm sınıfa veya seçilen öğrencilere toplu puan ver"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Toplu Puanla</span>
        </button>

        {onOpenLuckyDraw && (
          <button
            onClick={onOpenLuckyDraw}
            className="px-3 py-2 bg-linear-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 shadow-sm shadow-fuchsia-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Şans Çarkı / Kura Çek"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline">Kura Çek</span>
          </button>
        )}
        <div className="bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5">
          <span>{filteredStudents.length}</span>
          <span className="text-slate-400 font-normal">Öğrenci</span>
        </div>
      </div>

      {/* Bulk Action Controls Bar (When active) */}
      {isBulkMode && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-black text-amber-900 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {selectedStudentIds.length === classStudents.length ? (
                <CheckSquare className="w-4 h-4 text-amber-700" />
              ) : (
                <Square className="w-4 h-4 text-amber-700" />
              )}
              {selectedStudentIds.length === classStudents.length ? 'Tüm Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
            <span className="text-xs font-bold text-amber-800">
              {selectedStudentIds.length} / {classStudents.length} Öğrenci Seçili
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={selectedStudentIds.length === 0}
              onClick={() => handleBulkScore('plus')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Seçilenlere +1
            </button>
            <button
              type="button"
              disabled={selectedStudentIds.length === 0}
              onClick={() => handleBulkScore('minus')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Minus className="w-4 h-4 stroke-[3]" /> Seçilenlere -1
            </button>
          </div>
        </div>
      )}

      {bulkFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bulkFeedback}</span>
        </div>
      )}

      {/* Student Cards List */}
      <div className="space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
            Arama kriterine uygun öğrenci bulunamadı.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const counts = getStudentPlusMinusCount(student.id);

            return (
              <div
                key={student.id}
                className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Checkbox in bulk mode */}
                  {isBulkMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectStudent(student.id);
                      }}
                      className="p-1 text-amber-700 hover:text-amber-900 transition-colors cursor-pointer shrink-0"
                    >
                      {selectedStudentIds.includes(student.id) ? (
                        <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-100" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                  )}

                  {/* Clickable Student Info: Avatar + Name + Badges */}
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForModal(student)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left group cursor-pointer"
                    title={`${student.name} ${student.surname} - Detaylı Geçmiş ve Karne`}
                  >
                    {/* Photo / Avatar */}
                    <img
                      src={
                        student.photoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          student.name + ' ' + student.surname
                        )}&background=6366f1&color=fff`
                      }
                      alt={student.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 group-hover:border-indigo-500 transition-all shrink-0"
                    />

                    {/* Info & Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{student.number}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate flex items-center gap-1">
                          {student.name} {student.surname}
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 shrink-0" />
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                          +{counts.plus}
                        </span>
                        <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-100">
                          -{counts.minus}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                            counts.total >= 0 ? 'text-indigo-700 bg-indigo-50' : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          Net: {counts.total > 0 ? `+${counts.total}` : counts.total}
                        </span>

                        {(() => {
                          const stdBadges = badges.filter((b) => b.studentId === student.id && isBadgeActive(b));
                          if (stdBadges.length === 0) return null;
                          return (
                            <div className="flex items-center gap-1 flex-wrap">
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
                  </button>

                  {/* Plus / Minus Quick Scoring Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleScore(student.id, 'plus')}
                      className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                      title="Artı Ver (+1)"
                    >
                      <Plus className="w-6 h-6 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScore(student.id, 'minus')}
                      className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                      title="Eksi Ver (-1)"
                    >
                      <Minus className="w-6 h-6 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comprehensive Student Detail & History Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
        currentClass={currentClass}
        plusMinusLogs={plusMinusLogs}
        quizzes={quizzes}
        homeworks={homeworks}
        homeworkRecords={homeworkRecords}
        notebookControls={notebookControls}
        weights={weights}
        badges={badges}
        initialTab="plusminus"
        onAddPlusMinusLog={onAddLog}
        onUpdatePlusMinusLog={onUpdateLog}
        onDeletePlusMinusLog={onDeleteLog}
        onAddNotebookControl={onSaveNotebookControl}
        onUpdateNotebookControl={onUpdateNotebookControl}
        onDeleteNotebookControl={onDeleteNotebookControl}
      />
    </div>
  );
};
