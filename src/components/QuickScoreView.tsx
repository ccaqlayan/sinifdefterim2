import React, { useState } from 'react';
import { Student, PerformanceLog, ClassRoom, PlusMinusCategory } from '../types';
import { playScoreSound } from '../utils/audio';
import { Plus, Minus, Search, CheckCircle2, History, AlertCircle, Sparkles } from 'lucide-react';

interface QuickScoreViewProps {
  currentClass: ClassRoom;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  onAddLog: (log: Omit<PerformanceLog, 'id'>) => void;
  onDeleteLog: (id: string) => void;
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
  onDeleteLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlusMinusCategory>('Ders Katılımı');
  const [activeStudentIdForHistory, setActiveStudentIdForHistory] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const filteredStudents = students
    .filter((s) => s.classId === currentClass.id)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.number.includes(searchTerm)
    );

  const handleScore = (studentId: string, type: 'plus' | 'minus') => {
    playScoreSound(type);
    onAddLog({
      studentId,
      classId: currentClass.id,
      date: new Date().toISOString().slice(0, 10),
      type,
      category: selectedCategory,
      note: noteInput.trim() || undefined,
    });
    // Reset note after scoring
    setNoteInput('');
  };

  const getStudentPlusMinusCount = (studentId: string) => {
    const logs = plusMinusLogs.filter((l) => l.studentId === studentId);
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
        <div className="bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5">
          <span>{filteredStudents.length}</span>
          <span className="text-slate-400 font-normal">Öğrenci</span>
        </div>
      </div>

      {/* Student Cards List */}
      <div className="space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
            Arama kriterine uygun öğrenci bulunamadı.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const counts = getStudentPlusMinusCount(student.id);
            const studentLogs = plusMinusLogs.filter((l) => l.studentId === student.id);

            return (
              <div
                key={student.id}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  {/* Photo / Avatar */}
                  <img
                    src={
                      student.photoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        student.name + ' ' + student.surname
                      )}&background=6366f1&color=fff`
                    }
                    alt={student.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                  />

                  {/* Info & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{student.number}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">
                        {student.name} {student.surname}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
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
                    </div>
                  </div>

                  {/* Plus / Minus Quick Scoring Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleScore(student.id, 'plus')}
                      className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                      title="Artı Ver (+1)"
                    >
                      <Plus className="w-6 h-6 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleScore(student.id, 'minus')}
                      className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                      title="Eksi Ver (-1)"
                    >
                      <Minus className="w-6 h-6 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Bottom Toggle for Student History */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() =>
                      setActiveStudentIdForHistory(
                        activeStudentIdForHistory === student.id ? null : student.id
                      )
                    }
                    className="text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" /> Geçmiş Kayıtlar ({studentLogs.length})
                  </button>
                  {student.notes && (
                    <span className="text-slate-400 font-normal truncate max-w-[180px]">
                      Not: {student.notes}
                    </span>
                  )}
                </div>

                {/* Expanded Student History Drawer */}
                {activeStudentIdForHistory === student.id && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                    <div className="font-bold text-slate-700 mb-1">Son Değerlendirmeler:</div>
                    {studentLogs.length === 0 ? (
                      <p className="text-slate-400 italic">Henüz artı/eksi kaydı yok.</p>
                    ) : (
                      studentLogs.slice(-5).reverse().map((log) => (
                        <div key={log.id} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                                log.type === 'plus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.type === 'plus' ? '+1' : '-1'}
                            </span>
                            <span className="font-bold text-slate-800">{log.category}</span>
                            {log.note && <span className="text-slate-500 italic">({log.note})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{log.date}</span>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="text-rose-500 hover:text-rose-700 font-bold px-1"
                              title="Sil"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
