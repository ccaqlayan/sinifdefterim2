import React, { useState } from 'react';
import {
  Student,
  PerformanceLog,
  QuizScore,
  Homework,
  HomeworkRecord,
  NotebookControl,
  WeightSettings,
  RoundingMode,
  ClassRoom,
  OverallTermScore,
  HomeworkStatus,
  AcademicYearConfig,
  ActiveTermSelection,
} from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { exportTermScoresToExcel } from '../utils/excel';
import {
  filterLogsByTerm,
  filterQuizScoresByTerm,
  filterHomeworksByTerm,
  filterHomeworkRecordsByTerm,
  filterNotebookControlsByTerm,
  getTermLabel,
  getTermDateRangeString,
} from '../utils/termUtils';
import {
  Award,
  Download,
  Sliders,
  TrendingUp,
  Sparkles,
  ChevronRight,
  User,
  CheckCircle2,
  BookOpen,
  PlusCircle,
  MinusCircle,
  Clock,
  X,
  Check,
  FileText,
  Calendar,
  HelpCircle,
  ChevronDown,
  Layers,
  Settings,
  Filter,
  Pencil,
} from 'lucide-react';

interface ReportsViewProps {
  currentClass: ClassRoom;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworks?: Homework[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  onUpdateWeights: (weights: WeightSettings) => void;
  academicYearConfig: AcademicYearConfig;
  onOpenAcademicSettings?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentClass,
  students,
  plusMinusLogs,
  quizzes,
  homeworks = [],
  homeworkRecords,
  notebookControls,
  weights,
  onUpdateWeights,
  academicYearConfig,
  onOpenAcademicSettings,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<ActiveTermSelection>(
    academicYearConfig.activeTermId || 'term2'
  );
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [selectedStudentScore, setSelectedStudentScore] = useState<OverallTermScore | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'homework' | 'quiz' | 'plusminus' | 'notebook'>('homework');

  const classStudents = students.filter((s) => s.classId === currentClass.id);

  // Filter all data by selected term
  const termLogs = filterLogsByTerm(plusMinusLogs, selectedTerm, academicYearConfig);
  const termQuizzes = filterQuizScoresByTerm(quizzes, selectedTerm, academicYearConfig);
  const termHomeworks = filterHomeworksByTerm(homeworks, selectedTerm, academicYearConfig);
  const termHomeworkIds = new Set(termHomeworks.map((h) => h.id));
  const termHomeworkRecords = filterHomeworkRecordsByTerm(homeworkRecords, termHomeworkIds, selectedTerm, academicYearConfig);
  const termNotebooks = filterNotebookControlsByTerm(notebookControls, selectedTerm, academicYearConfig);

  const classHomeworks = termHomeworks.filter((h) => h.classId === currentClass.id);

  // Calculate scores for all students strictly using filtered term data
  const studentScores = classStudents.map((std) =>
    calculateStudentOverallScore(std, termLogs, termQuizzes, termHomeworkRecords, termNotebooks, weights)
  );

  // Sort by final score descending
  studentScores.sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1));

  const handleWeightChange = (key: keyof WeightSettings, val: number | RoundingMode) => {
    const updated = { ...weights, [key]: val };
    onUpdateWeights(updated);
  };

  const totalWeight = weights.quizWeight + weights.plusMinusWeight + weights.homeworkWeight + weights.notebookWeight;

  const currentTermLabel = getTermLabel(selectedTerm, academicYearConfig);
  const currentTermDates = getTermDateRangeString(selectedTerm, academicYearConfig);

  const handleExportExcel = () => {
    exportTermScoresToExcel(currentClass.name, currentClass.subject, studentScores, currentTermLabel);
  };

  // Find updated selected student score when tab or term changes
  const activeStudentScore = selectedStudentScore
    ? studentScores.find((s) => s.studentId === selectedStudentScore.studentId) || selectedStudentScore
    : null;

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Banner & Export Action */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md space-y-3 relative">
        <div className="flex items-start sm:items-center justify-between gap-2 pr-10 sm:pr-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600/60 border border-indigo-400/30 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">Dönem Sonu Performans Raporu</h3>
                <span className="text-[9px] sm:text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0">
                  {currentTermLabel}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-indigo-200 truncate">
                {currentClass.name} - {currentClass.subject} ({currentTermDates})
              </p>
            </div>
          </div>

          <div className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto shrink-0">
            <button
              onClick={handleExportExcel}
              className="p-2 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Excel Raporu İndir"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel Dışa Aktar</span>
            </button>
          </div>
        </div>

        {/* Term Selection Segmented Control */}
        <div className="bg-slate-950/70 p-1 rounded-xl border border-white/10 flex gap-1">
          <button
            onClick={() => setSelectedTerm('term1')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
              selectedTerm === 'term1'
                ? 'bg-indigo-600 text-white shadow-xs border border-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>1. Dönem</span>
          </button>

          <button
            onClick={() => setSelectedTerm('term2')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
              selectedTerm === 'term2'
                ? 'bg-indigo-600 text-white shadow-xs border border-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>2. Dönem</span>
          </button>

          <button
            onClick={() => setSelectedTerm('all')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
              selectedTerm === 'all'
                ? 'bg-indigo-600 text-white shadow-xs border border-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Tüm Yıl</span>
          </button>
        </div>

        {/* Weights Summary Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-200 flex items-center gap-1 text-[11px] sm:text-xs">
              <Sliders className="w-3.5 h-3.5" /> Ağırlık Dağılımı:
            </span>
            <button
              onClick={() => setShowWeightSettings(!showWeightSettings)}
              className="p-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 hover:text-amber-200 transition-all cursor-pointer flex items-center gap-1 border border-white/20 text-xs font-bold"
              title="Etki Yüzdelerini ve Yuvarlamayı Düzenle"
            >
              <Pencil className="w-3.5 h-3.5" />
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showWeightSettings ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex h-6 sm:h-7 rounded-xl overflow-hidden bg-slate-900/80 p-0.5 border border-white/10 shadow-inner">
            {weights.quizWeight > 0 && (
              <div
                style={{ width: `${weights.quizWeight}%` }}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center text-[10px] sm:text-xs font-black text-white px-1 truncate transition-all duration-300 border-r border-indigo-700/40"
                title={`Quiz / Sınav: %${weights.quizWeight}`}
              >
                <span className="truncate">{weights.quizWeight >= 12 ? `Quiz %${weights.quizWeight}` : `%${weights.quizWeight}`}</span>
              </div>
            )}
            {weights.plusMinusWeight > 0 && (
              <div
                style={{ width: `${weights.plusMinusWeight}%` }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center text-[10px] sm:text-xs font-black text-white px-1 truncate transition-all duration-300 border-r border-emerald-700/40"
                title={`Katılım / Artı-Eksi: %${weights.plusMinusWeight}`}
              >
                <span className="truncate">{weights.plusMinusWeight >= 12 ? `Katılım %${weights.plusMinusWeight}` : `%${weights.plusMinusWeight}`}</span>
              </div>
            )}
            {weights.homeworkWeight > 0 && (
              <div
                style={{ width: `${weights.homeworkWeight}%` }}
                className="bg-gradient-to-r from-sky-600 to-sky-500 flex items-center justify-center text-[10px] sm:text-xs font-black text-white px-1 truncate transition-all duration-300 border-r border-sky-700/40"
                title={`Ödev Takip: %${weights.homeworkWeight}`}
              >
                <span className="truncate">{weights.homeworkWeight >= 12 ? `Ödev %${weights.homeworkWeight}` : `%${weights.homeworkWeight}`}</span>
              </div>
            )}
            {weights.notebookWeight > 0 && (
              <div
                style={{ width: `${weights.notebookWeight}%` }}
                className="bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center text-[10px] sm:text-xs font-black text-white px-1 truncate transition-all duration-300"
                title={`Defter Kontrol: %${weights.notebookWeight}`}
              >
                <span className="truncate">{weights.notebookWeight >= 12 ? `Defter %${weights.notebookWeight}` : `%${weights.notebookWeight}`}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customizable Weight Settings Panel with Smooth Accordion Expand */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showWeightSettings
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 overflow-hidden'
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Ağırlıklı Etki Yüzdeleri ve Yuvarlama Ayarları
              </h4>
              {totalWeight !== 100 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Toplam Yüzde %100 olmalı! (Mevcut: %{totalWeight})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-800">
              <div>
                <label className="block text-slate-600 mb-1">Quiz / Sınav Etkisi: %{weights.quizWeight}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.quizWeight}
                  onChange={(e) => handleWeightChange('quizWeight', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Artı / Eksi Katılım Etkisi: %{weights.plusMinusWeight}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.plusMinusWeight}
                  onChange={(e) => handleWeightChange('plusMinusWeight', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Ödev Takip Etkisi: %{weights.homeworkWeight}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.homeworkWeight}
                  onChange={(e) => handleWeightChange('homeworkWeight', Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Defter Kontrol Etkisi: %{weights.notebookWeight}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.notebookWeight}
                  onChange={(e) => handleWeightChange('notebookWeight', Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>
            </div>

            {/* Rounding Mode Options */}
            <div className="pt-3 border-t border-indigo-200/80 space-y-2">
              <label className="text-xs font-black text-indigo-950 uppercase tracking-wider block">
                Puan Yuvarlama Yöntemi (Her Zaman Üste Yuvarlar):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleWeightChange('roundingMode', 'none')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    (!weights.roundingMode || weights.roundingMode === 'none')
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 border-indigo-200/60 hover:bg-white/80'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">Yuvarlama Yok</div>
                    <div className="text-[10px] opacity-80 font-normal">Tam / Ondalıklı (Örn: 82.4)</div>
                  </div>
                  {(!weights.roundingMode || weights.roundingMode === 'none') && <Check className="w-4 h-4 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleWeightChange('roundingMode', 'ceil5')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    weights.roundingMode === 'ceil5'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 border-indigo-200/60 hover:bg-white/80'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">5'in Katına Üste Yuvarla</div>
                    <div className="text-[10px] opacity-80 font-normal">81 ➔ 85 | 86 ➔ 90</div>
                  </div>
                  {weights.roundingMode === 'ceil5' && <Check className="w-4 h-4 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleWeightChange('roundingMode', 'ceil10')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    weights.roundingMode === 'ceil10'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 border-indigo-200/60 hover:bg-white/80'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">10'un Katına Üste Yuvarla</div>
                    <div className="text-[10px] opacity-80 font-normal">81 ➔ 90 | 85 ➔ 90</div>
                  </div>
                  {weights.roundingMode === 'ceil10' && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Term Performance Table Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" /> {currentTermLabel} Öğrenci Not Listesi ({studentScores.length})
          </h4>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Kayıtlar sadece bu dönemin tarihlerine göre filtrelenmiştir
          </span>
        </div>

        {studentScores.map((score, index) => {
          const student = students.find((s) => s.id === score.studentId);

          return (
            <div
              key={score.studentId}
              onClick={() => {
                setSelectedStudentScore(score);
                setActiveDetailTab('homework');
              }}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <img
                    src={
                      student?.photoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(score.studentName)}&background=6366f1&color=fff`
                    }
                    alt={score.studentName}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:border-indigo-400 transition-all"
                  />
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-all">
                      #{score.studentNumber} {score.studentName}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-medium">{score.letterGrade}</span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-xs">
                    {score.finalScore !== null ? score.finalScore : '-'}{' '}
                    {score.finalScore !== null && <span className="text-[10px] font-normal opacity-80">/100</span>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-all" />
                </div>
              </div>

              {/* Progress Bars breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-[10px]">
                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Quiz</span>
                    <span className="text-slate-800">{score.quizAverage !== null ? score.quizAverage : '-'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.quizAverage ?? 0}%` }} className="h-full bg-indigo-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Katılım (+/-)</span>
                    <span className="text-slate-800">
                      {score.plusMinusNormalized !== null ? score.plusMinusNormalized : '-'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.plusMinusNormalized ?? 0}%` }} className="h-full bg-emerald-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Ödev</span>
                    <span className="text-slate-800">{score.homeworkScore !== null ? score.homeworkScore : '-'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.homeworkScore ?? 0}%` }} className="h-full bg-sky-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Defter</span>
                    <span className="text-slate-800">
                      {score.notebookAverage !== null ? score.notebookAverage : '-'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.notebookAverage ?? 0}%` }} className="h-full bg-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* STUDENT DETAIL MODAL */}
      {activeStudentScore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={
                    students.find((s) => s.id === activeStudentScore.studentId)?.photoUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      activeStudentScore.studentName
                    )}&background=6366f1&color=fff`
                  }
                  alt={activeStudentScore.studentName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white/30 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      #{activeStudentScore.studentNumber} {activeStudentScore.studentName}
                    </h3>
                    <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                      {currentTermLabel}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium">
                    Öğrenci Detaylı Performans Raporu
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentScore(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Large Score Display Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-indigo-800/80 flex items-center justify-between gap-3 text-white shrink-0">
              <div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block mb-0.5">
                  Dönem Sonu Başarı Notu
                </span>
                <span className="inline-block bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-lg shadow-xs">
                  {activeStudentScore.letterGrade}
                </span>
              </div>
              <div className="text-right flex items-baseline gap-1 bg-white/10 border border-white/20 px-4 py-2 rounded-2xl shadow-inner">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {activeStudentScore.finalScore !== null ? activeStudentScore.finalScore : '-'}
                </span>
                <span className="text-sm font-bold text-indigo-200">/100</span>
              </div>
            </div>

            {/* Sub-tab Switchers for Student Detail */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveDetailTab('homework')}
                className={`flex-1 py-2.5 px-3 border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
                  activeDetailTab === 'homework'
                    ? 'border-sky-600 text-sky-700 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Ödevler ({termHomeworks.length})
              </button>
              <button
                onClick={() => setActiveDetailTab('quiz')}
                className={`flex-1 py-2.5 px-3 border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
                  activeDetailTab === 'quiz'
                    ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sınav / Quiz ({termQuizzes.filter((q) => q.studentId === activeStudentScore.studentId).length})
              </button>
              <button
                onClick={() => setActiveDetailTab('plusminus')}
                className={`flex-1 py-2.5 px-3 border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
                  activeDetailTab === 'plusminus'
                    ? 'border-emerald-600 text-emerald-700 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Katılım (+{activeStudentScore.plusCount} / -{activeStudentScore.minusCount})
              </button>
              <button
                onClick={() => setActiveDetailTab('notebook')}
                className={`flex-1 py-2.5 px-3 border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
                  activeDetailTab === 'notebook'
                    ? 'border-amber-600 text-amber-700 bg-white font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Defter Kontrolü
              </button>
            </div>

            {/* Detail Tab Contents */}
            <div className="p-4 overflow-y-auto space-y-4 text-slate-800 flex-1">
              {/* 1. ÖDEV DETAYI */}
              {activeDetailTab === 'homework' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-black text-sky-900 flex items-center gap-1.5 uppercase">
                      <FileText className="w-4 h-4 text-sky-600" /> {currentTermLabel} Ödev Teslim Kayıtları
                    </h4>
                    <span className="text-xs font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200">
                      {activeStudentScore.homeworkScore !== null ? `Başarı: %${activeStudentScore.homeworkScore}` : 'Veri Yok'}
                    </span>
                  </div>

                  {classHomeworks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Bu dönem için atanmış ödev bulunmuyor.
                    </div>
                  ) : (
                    classHomeworks.map((hw) => {
                      const record = termHomeworkRecords.find(
                        (r) => r.homeworkId === hw.id && r.studentId === activeStudentScore.studentId
                      );
                      const status: HomeworkStatus = record?.status || 'missing';

                      return (
                        <div
                          key={hw.id}
                          className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-extrabold text-slate-900">{hw.title}</h5>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${
                                status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : status === 'excused'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {status === 'completed'
                                ? 'Teslim Edildi'
                                : status === 'late'
                                ? 'Geç Teslim'
                                : status === 'excused'
                                ? 'İzinli / Mazeretli'
                                : 'Teslim Edilmedi'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{hw.description}</p>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span>Son Teslim: {hw.dueDate}</span>
                            {record?.updatedAt && <span>İşlem Tarihi: {record.updatedAt}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 2. QUIZ / SINAV DETAYI */}
              {activeDetailTab === 'quiz' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> {currentTermLabel} Sınav ve Quiz Notları
                    </h4>
                    <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200">
                      {activeStudentScore.quizAverage !== null ? `Ortalama: ${activeStudentScore.quizAverage} / 100` : 'Veri Yok'}
                    </span>
                  </div>

                  {(() => {
                    const studentQuizzes = termQuizzes.filter((q) => q.studentId === activeStudentScore.studentId);

                    if (studentQuizzes.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Bu dönem için girilmiş sınav/quiz notu bulunmuyor.
                        </div>
                      );
                    }

                    return studentQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                          <span>{quiz.quizTitle}</span>
                          <span className="text-indigo-600 font-black text-sm">{quiz.score} / 100</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
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
                    ));
                  })()}
                </div>
              )}

              {/* 3. KATILIM (ARTI/EKSİ) DETAYI */}
              {activeDetailTab === 'plusminus' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase">
                      <PlusCircle className="w-4 h-4 text-emerald-600" /> {currentTermLabel} Derse Katılım Kayıtları
                    </h4>
                    <div className="flex items-center gap-1 text-xs font-black">
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                        +{activeStudentScore.plusCount} Artı
                      </span>
                      <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                        -{activeStudentScore.minusCount} Eksi
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const studentLogs = termLogs.filter((p) => p.studentId === activeStudentScore.studentId);

                    if (studentLogs.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Bu dönem için henüz katılım (artı/eksi) verisi kaydedilmemiş.
                        </div>
                      );
                    }

                    return studentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          {log.type === 'plus' ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                              +
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">
                              -
                            </span>
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {log.category || log.note || (log.type === 'plus' ? 'Derse Etkin Katılım' : 'Ödev/Derse Hazırlık Eksikliği')}
                            </div>
                            <div className="text-[10px] text-slate-400">{log.date}</div>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            log.type === 'plus' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {log.type === 'plus' ? '+1 Performans' : '-1 Performans'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* 4. DEFTER KONTROL DETAYI */}
              {activeDetailTab === 'notebook' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" /> {currentTermLabel} Defter Kontrolleri
                    </h4>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                      {activeStudentScore.notebookAverage !== null ? `Defter Puanı: %${activeStudentScore.notebookAverage}` : 'Veri Yok'}
                    </span>
                  </div>

                  {(() => {
                    const studentNotebooks = termNotebooks.filter(
                      (n) => n.studentId === activeStudentScore.studentId
                    );

                    if (studentNotebooks.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Bu dönem için henüz defter kontrolü kaydedilmemiş.
                        </div>
                      );
                    }

                    return studentNotebooks.map((nb) => (
                      <div
                        key={nb.id}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">Tarih: {nb.date}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${
                              nb.status === 'full'
                                ? 'bg-emerald-100 text-emerald-800'
                                : nb.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {nb.status === 'full'
                              ? 'Eksiksiz & Düzenli (100p)'
                              : nb.status === 'partial'
                              ? 'Kısmen Eksik (50p)'
                              : 'Defter Yok / Eksik (0p)'}
                          </span>
                        </div>
                        {nb.note && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            Öğretmen Notu: {nb.note}
                          </p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedStudentScore(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
