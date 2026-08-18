import React, { useState, useMemo } from 'react';
import { 
  ClassRoom, Student, PerformanceLog, NotebookControl, Quiz, Homework 
} from '../types';
import { 
  Trash2, RotateCcw, Flame, ArrowLeft, Search, Filter, CheckCircle2, 
  BookMarked, Zap, Award, CheckSquare, Calendar, AlertTriangle, X,
  PlusCircle, MinusCircle, User, FileText, Check, Clock
} from 'lucide-react';

interface TrashBinViewProps {
  classes: ClassRoom[];
  selectedClassId?: string;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  notebookControls: NotebookControl[];
  quizDefinitions: Quiz[];
  homeworks: Homework[];
  onRestorePlusMinusLog: (id: string) => void;
  onPermanentDeletePlusMinusLog: (id: string) => void;
  onRestoreNotebookControl: (id: string) => void;
  onPermanentDeleteNotebookControl: (id: string) => void;
  onRestoreQuizDefinition: (id: string) => void;
  onPermanentDeleteQuizDefinition: (id: string) => void;
  onRestoreHomework: (id: string) => void;
  onPermanentDeleteHomework: (id: string) => void;
  onBack: () => void;
}

type TrashCategory = 'notebook' | 'plusminus' | 'quiz' | 'homework';

interface DeleteConfirmTarget {
  type: TrashCategory;
  id: string;
  title: string;
  subtitle?: string;
}

export const TrashBinView: React.FC<TrashBinViewProps> = ({
  classes,
  selectedClassId,
  students,
  plusMinusLogs,
  notebookControls,
  quizDefinitions,
  homeworks,
  onRestorePlusMinusLog,
  onPermanentDeletePlusMinusLog,
  onRestoreNotebookControl,
  onPermanentDeleteNotebookControl,
  onRestoreQuizDefinition,
  onPermanentDeleteQuizDefinition,
  onRestoreHomework,
  onPermanentDeleteHomework,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TrashCategory>('notebook');
  const [classFilter, setClassFilter] = useState<string>(selectedClassId || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [permDeleteTarget, setPermDeleteTarget] = useState<DeleteConfirmTarget | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  // Helper map for students & classes
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRoom>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  // Deleted items
  const deletedNotebooks = useMemo(() => {
    return notebookControls
      .filter((n) => n.isDeleted)
      .filter((n) => classFilter === 'all' || n.classId === classFilter)
      .filter((n) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const std = studentMap.get(n.studentId);
        const stdName = std ? `${std.name} ${std.surname}`.toLowerCase() : '';
        const stdNum = std?.number?.toLowerCase() || '';
        const note = n.note?.toLowerCase() || '';
        return stdName.includes(term) || stdNum.includes(term) || note.includes(term);
      })
      .sort((a, b) => (b.deletedAt || b.date).localeCompare(a.deletedAt || a.date));
  }, [notebookControls, classFilter, searchTerm, studentMap]);

  const deletedPlusMinus = useMemo(() => {
    return plusMinusLogs
      .filter((p) => p.isDeleted)
      .filter((p) => classFilter === 'all' || p.classId === classFilter)
      .filter((p) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const std = studentMap.get(p.studentId);
        const stdName = std ? `${std.name} ${std.surname}`.toLowerCase() : '';
        const stdNum = std?.number?.toLowerCase() || '';
        const cat = p.category?.toLowerCase() || '';
        const note = p.note?.toLowerCase() || '';
        return stdName.includes(term) || stdNum.includes(term) || cat.includes(term) || note.includes(term);
      })
      .sort((a, b) => (b.deletedAt || b.date).localeCompare(a.deletedAt || a.date));
  }, [plusMinusLogs, classFilter, searchTerm, studentMap]);

  const deletedQuizzes = useMemo(() => {
    return quizDefinitions
      .filter((q) => q.isDeleted)
      .filter((q) => classFilter === 'all' || q.classId === classFilter)
      .filter((q) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const title = q.title.toLowerCase();
        const desc = q.description?.toLowerCase() || '';
        return title.includes(term) || desc.includes(term);
      })
      .sort((a, b) => (b.deletedAt || b.date).localeCompare(a.deletedAt || a.date));
  }, [quizDefinitions, classFilter, searchTerm]);

  const deletedHomeworks = useMemo(() => {
    return homeworks
      .filter((h) => h.isDeleted)
      .filter((h) => classFilter === 'all' || h.classId === classFilter)
      .filter((h) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const title = h.title.toLowerCase();
        const desc = h.description?.toLowerCase() || '';
        return title.includes(term) || desc.includes(term);
      })
      .sort((a, b) => (b.deletedAt || b.dueDate).localeCompare(a.deletedAt || a.dueDate));
  }, [homeworks, classFilter, searchTerm]);

  // Overall totals across all classes for badges
  const totalDeletedNotebooksAll = useMemo(() => notebookControls.filter((n) => n.isDeleted).length, [notebookControls]);
  const totalDeletedPlusMinusAll = useMemo(() => plusMinusLogs.filter((p) => p.isDeleted).length, [plusMinusLogs]);
  const totalDeletedQuizzesAll = useMemo(() => quizDefinitions.filter((q) => q.isDeleted).length, [quizDefinitions]);
  const totalDeletedHomeworksAll = useMemo(() => homeworks.filter((h) => h.isDeleted).length, [homeworks]);
  const grandTotalDeleted = totalDeletedNotebooksAll + totalDeletedPlusMinusAll + totalDeletedQuizzesAll + totalDeletedHomeworksAll;

  // Format timestamp
  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleConfirmPermanentDelete = () => {
    if (!permDeleteTarget) return;

    if (permDeleteTarget.type === 'notebook') {
      onPermanentDeleteNotebookControl(permDeleteTarget.id);
      showToast('Defter kontrol kaydı kalıcı olarak silindi.');
    } else if (permDeleteTarget.type === 'plusminus') {
      onPermanentDeletePlusMinusLog(permDeleteTarget.id);
      showToast('Artı / eksi kaydı kalıcı olarak silindi.');
    } else if (permDeleteTarget.type === 'quiz') {
      onPermanentDeleteQuizDefinition(permDeleteTarget.id);
      showToast('Quiz ve bağlı tüm puanlar kalıcı olarak silindi.');
    } else if (permDeleteTarget.type === 'homework') {
      onPermanentDeleteHomework(permDeleteTarget.id);
      showToast('Ödev ve bağlı tüm kayıtlar kalıcı olarak silindi.');
    }

    setPermDeleteTarget(null);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-rose-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all shadow-xs cursor-pointer shrink-0"
              title="Ayarlara Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                  Çöp Kutusu & Geri Yükleme
                </h2>
                {grandTotalDeleted > 0 && (
                  <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                    {grandTotalDeleted} Silinmiş Öge
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Silinen defter, artı/eksi, quiz ve ödevleri inceleyebilir, anında geri getirebilirsiniz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Ayarlara Dön
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-rose-900/60">
          {/* Class Filter */}
          <div className="relative flex-1 sm:max-w-[220px]">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-slate-900/90 text-white font-bold text-xs py-2 pl-8 pr-7 rounded-xl border border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
            >
              <option value="all">Tüm Sınıflar</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.subject})
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-rose-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Öğrenci adı, no, başlık veya not ara..."
              className="w-full bg-slate-900/90 text-white text-xs py-2 pl-8 pr-8 rounded-xl border border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-rose-200/50 font-medium"
            />
            <Search className="w-4 h-4 text-rose-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-rose-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Tab 1: Defter Kontrolleri */}
        <button
          type="button"
          onClick={() => setActiveTab('notebook')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            activeTab === 'notebook'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeTab === 'notebook' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-amber-800'
            }`}>
              <BookMarked className="w-4 h-4" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              activeTab === 'notebook' ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {totalDeletedNotebooksAll}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black">Defter Kayıtları</h4>
            <p className={`text-[10px] ${activeTab === 'notebook' ? 'text-slate-900/80 font-bold' : 'text-slate-500'}`}>
              Silinen kontroller
            </p>
          </div>
        </button>

        {/* Tab 2: Artı / Eksi */}
        <button
          type="button"
          onClick={() => setActiveTab('plusminus')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            activeTab === 'plusminus'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-black'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeTab === 'plusminus' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              activeTab === 'plusminus' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {totalDeletedPlusMinusAll}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black">Artı / Eksi (+/-)</h4>
            <p className={`text-[10px] ${activeTab === 'plusminus' ? 'text-emerald-100 font-bold' : 'text-slate-500'}`}>
              Silinen performanslar
            </p>
          </div>
        </button>

        {/* Tab 3: Quizler */}
        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            activeTab === 'quiz'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-black'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeTab === 'quiz' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
            }`}>
              <Award className="w-4 h-4" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              activeTab === 'quiz' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {totalDeletedQuizzesAll}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black">Quiz & Sınavlar</h4>
            <p className={`text-[10px] ${activeTab === 'quiz' ? 'text-indigo-100 font-bold' : 'text-slate-500'}`}>
              Silinen sınavlar
            </p>
          </div>
        </button>

        {/* Tab 4: Ödevler */}
        <button
          type="button"
          onClick={() => setActiveTab('homework')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            activeTab === 'homework'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-black'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeTab === 'homework' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
            }`}>
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              activeTab === 'homework' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {totalDeletedHomeworksAll}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black">Ödev Takibi</h4>
            <p className={`text-[10px] ${activeTab === 'homework' ? 'text-blue-100 font-bold' : 'text-slate-500'}`}>
              Silinen ödevler
            </p>
          </div>
        </button>
      </div>

      {/* Tab 1 Content: Defter Kontrolleri */}
      {activeTab === 'notebook' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black text-slate-800">
                Silinmiş Defter Kontrol Kayıtları ({deletedNotebooks.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {classFilter === 'all' ? 'Tüm sınıflar' : classes.find((c) => c.id === classFilter)?.name || ''}
            </span>
          </div>

          {deletedNotebooks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto stroke-[1.8]" />
              <h4 className="text-sm font-bold text-slate-700">Silinen Defter Kaydı Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silinen tüm defter kontrol kayıtları burada listelenir. Şu an çöp kutusunda bu kategoriye ait öge yok.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deletedNotebooks.map((nb) => {
                const std = studentMap.get(nb.studentId);
                const cls = classMap.get(nb.classId);
                return (
                  <div
                    key={nb.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          Silinmiş Defter
                        </span>
                        {cls && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {cls.name} ({cls.subject})
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" /> Kontrol Tarihi: {nb.date}
                        </span>
                        {nb.deletedAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Silinme: {formatDateTime(nb.deletedAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                          {std?.number || '#'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {std ? `${std.name} ${std.surname}` : 'Öğrenci Kaydı'}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                              nb.percentage >= 80 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : nb.percentage >= 50 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              %{nb.percentage} Düzen ({nb.status === 'full' ? 'Tam' : nb.status === 'partial' ? 'Eksik' : 'Yok'})
                            </span>
                            {nb.note && (
                              <span className="text-slate-500 italic truncate max-w-[240px]">
                                "{nb.note}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreNotebookControl(nb.id);
                          showToast(`${std ? std.name : 'Öğrenci'} defter kaydı başarıyla geri getirildi.`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Geri Getir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPermDeleteTarget({
                            type: 'notebook',
                            id: nb.id,
                            title: `${std ? std.name + ' ' + std.surname : 'Öğrenci'} - ${nb.date} Defter Kontrolü`,
                            subtitle: `%${nb.percentage} (${nb.status}) puanlı defter kaydı kalıcı silinecektir.`,
                          })
                        }
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" /> Kalıcı Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2 Content: Artı / Eksi (+/-) */}
      {activeTab === 'plusminus' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-800">
                Silinmiş Artı / Eksi (+/-) Kayıtları ({deletedPlusMinus.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {classFilter === 'all' ? 'Tüm sınıflar' : classes.find((c) => c.id === classFilter)?.name || ''}
            </span>
          </div>

          {deletedPlusMinus.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto stroke-[1.8]" />
              <h4 className="text-sm font-bold text-slate-700">Silinen Artı / Eksi Kaydı Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silinen tüm artı ve eksi puan kayıtları burada listelenir. Şu an çöp kutusunda bu kategoriye ait öge yok.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deletedPlusMinus.map((p) => {
                const std = studentMap.get(p.studentId);
                const cls = classMap.get(p.classId);
                const isPlus = p.type === 'plus';

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isPlus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPlus ? <PlusCircle className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
                          Silinmiş {isPlus ? 'Artı (+)' : 'Eksi (-)'}
                        </span>
                        {cls && (
                          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {cls.name} ({cls.subject})
                          </span>
                        )}
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {p.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" /> Tarih: {p.date}
                        </span>
                        {p.deletedAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Silinme: {formatDateTime(p.deletedAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isPlus ? 'bg-emerald-500/20 text-emerald-800' : 'bg-rose-500/20 text-rose-800'
                        }`}>
                          {isPlus ? '+1' : '-1'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {std ? `${std.name} ${std.surname} (No: ${std.number})` : 'Öğrenci Kaydı'}
                          </h4>
                          {p.note && (
                            <p className="text-xs text-slate-500 italic truncate mt-0.5">
                              "{p.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onRestorePlusMinusLog(p.id);
                          showToast(`${std ? std.name : 'Öğrenci'} ${isPlus ? 'artı (+)' : 'eksi (-)'} kaydı başarıyla geri getirildi.`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Geri Getir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPermDeleteTarget({
                            type: 'plusminus',
                            id: p.id,
                            title: `${std ? std.name + ' ' + std.surname : 'Öğrenci'} - ${isPlus ? '+1 Artı' : '-1 Eksi'} (${p.category})`,
                            subtitle: `${p.date} tarihli bu performans kaydı veritabanından kalıcı olarak silinecektir.`,
                          })
                        }
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" /> Kalıcı Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3 Content: Quizler */}
      {activeTab === 'quiz' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800">
                Silinmiş Quizler & Sınavlar ({deletedQuizzes.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {classFilter === 'all' ? 'Tüm sınıflar' : classes.find((c) => c.id === classFilter)?.name || ''}
            </span>
          </div>

          {deletedQuizzes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto stroke-[1.8]" />
              <h4 className="text-sm font-bold text-slate-700">Silinen Quiz Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silinen sınav ve quizler burada listelenir. Şu an çöp kutusunda bu kategoriye ait öge yok.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deletedQuizzes.map((q) => {
                const cls = classMap.get(q.classId);
                return (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          Silinmiş Quiz
                        </span>
                        {cls && (
                          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {cls.name} ({cls.subject})
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" /> Sınav Tarihi: {q.date}
                        </span>
                        {q.deletedAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Silinme: {formatDateTime(q.deletedAt)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 mt-1">{q.title}</h4>
                      {q.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{q.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreQuizDefinition(q.id);
                          showToast(`"${q.title}" quizi başarıyla geri getirildi.`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Geri Getir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPermDeleteTarget({
                            type: 'quiz',
                            id: q.id,
                            title: q.title,
                            subtitle: `Bu quiz ve bağlı öğrenci sınav puanları veritabanından kalıcı olarak silinecektir.`,
                          })
                        }
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" /> Kalıcı Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4 Content: Ödevler */}
      {activeTab === 'homework' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-800">
                Silinmiş Ödevler ({deletedHomeworks.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {classFilter === 'all' ? 'Tüm sınıflar' : classes.find((c) => c.id === classFilter)?.name || ''}
            </span>
          </div>

          {deletedHomeworks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto stroke-[1.8]" />
              <h4 className="text-sm font-bold text-slate-700">Silinen Ödev Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silinen ödevler ve teslim kayıtları burada listelenir. Şu an çöp kutusunda bu kategoriye ait öge yok.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deletedHomeworks.map((hw) => {
                const cls = classMap.get(hw.classId);
                return (
                  <div
                    key={hw.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          Silinmiş Ödev
                        </span>
                        {cls && (
                          <span className="bg-blue-100 text-blue-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {cls.name} ({cls.subject})
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" /> Son Teslim: {hw.dueDate}
                        </span>
                        {hw.deletedAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Silinme: {formatDateTime(hw.deletedAt)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 mt-1">{hw.title}</h4>
                      {hw.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{hw.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreHomework(hw.id);
                          showToast(`"${hw.title}" ödevi başarıyla geri getirildi.`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Geri Getir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPermDeleteTarget({
                            type: 'homework',
                            id: hw.id,
                            title: hw.title,
                            subtitle: `Bu ödev ve öğrencilerin tüm teslim kayıtları veritabanından kalıcı olarak silinecektir.`,
                          })
                        }
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" /> Kalıcı Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {permDeleteTarget && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-600 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                Kalıcı Silme Onayı
              </h3>
              <button
                type="button"
                onClick={() => setPermDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-950 text-xs space-y-2">
              <p className="font-extrabold text-sm flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> DİKKAT: Bu İşlem Geri Alınamaz!
              </p>
              <p className="text-slate-800">
                <strong>"{permDeleteTarget.title}"</strong> başlıklı kayıt veritabanından kalıcı olarak silinecektir.
              </p>
              {permDeleteTarget.subtitle && (
                <p className="text-[11px] text-slate-600 italic">{permDeleteTarget.subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPermDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Flame className="w-4 h-4" /> Evet, Kalıcı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
