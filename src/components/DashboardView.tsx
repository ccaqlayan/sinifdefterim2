import React from 'react';
import { ClassRoom, Student, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, WeightSettings } from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { Zap, BookMarked, Award, Users, Plus, Upload, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  onNavigateTab: (tab: string) => void;
  onOpenAddStudent: () => void;
  onOpenBulkImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  weights,
  onNavigateTab,
  onOpenAddStudent,
  onOpenBulkImport,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Overall calculations for active class
  const studentScores = classStudents.map((std) =>
    calculateStudentOverallScore(std, plusMinusLogs, quizzes, homeworkRecords, notebookControls, weights)
  );

  const classAvgScore = studentScores.length > 0
    ? Math.round((studentScores.reduce((acc, s) => acc + s.finalScore, 0) / studentScores.length) * 10) / 10
    : 0;

  const totalPlus = studentScores.reduce((acc, s) => acc + s.plusCount, 0);
  const totalMinus = studentScores.reduce((acc, s) => acc + s.minusCount, 0);

  const notebookAvgPercent = classStudents.length > 0
    ? Math.round(studentScores.reduce((acc, s) => acc + s.notebookAverage, 0) / classStudents.length)
    : 0;

  const lowNotebookCount = studentScores.filter((s) => s.notebookAverage < 60).length;
  const highPerformers = studentScores.filter((s) => s.finalScore >= 85).length;

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Banner / Header Summary */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-indigo-400/20">
              {currentClass?.term || '2025-2026 2. Dönem'}
            </span>
            <span className="text-xs text-indigo-200 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Mobil Takip Aktif
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">{currentClass?.name} ({currentClass?.subject})</h2>
          <p className="text-xs text-indigo-200 mt-0.5">Sınıf Öğrenci Sayısı: <strong className="text-white">{classStudents.length} Öğrenci</strong></p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[11px] text-indigo-200 font-medium">Sınıf Ortalaması</p>
              <p className="text-xl font-black text-white mt-0.5">{classAvgScore} <span className="text-xs font-normal opacity-70">/100</span></p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[11px] text-indigo-200 font-medium">Net Artı / Eksi</p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">+{totalPlus} <span className="text-rose-300 font-bold text-sm">/-{totalMinus}</span></p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[11px] text-indigo-200 font-medium">Defter Tamlık</p>
              <p className="text-xl font-black text-amber-300 mt-0.5">%{notebookAvgPercent}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[11px] text-indigo-200 font-medium">Pekiyi Seviyesi</p>
              <p className="text-xl font-black text-sky-300 mt-0.5">{highPerformers} <span className="text-xs font-normal opacity-70">öğrenci</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Quick Selection Slider / Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sınıflarım</h3>
          <span className="text-[11px] text-slate-500">{classes.length} aktif sınıf</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {classes.map((c) => {
            const isSelected = c.id === selectedClassId;
            const cStudents = students.filter((s) => s.classId === c.id);
            return (
              <button
                key={c.id}
                onClick={() => onSelectClass(c.id)}
                className={`shrink-0 p-3.5 rounded-2xl text-left border transition-all w-36 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-base font-black truncate">{c.name}</div>
                <div className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{c.subject}</div>
                <div className={`text-[11px] mt-2 font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {cStudents.length} öğrenci
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Quick Action Modules */}
      <div>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Hızlı İşlem Paneli</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onNavigateTab('quick-score')}
            className="p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                Canlı
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">Pratik Artı / Eksi</h4>
              <p className="text-xs text-slate-600 mt-0.5">Sınıf esnasında tek tıkla canlı değerlendirme yap</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('notebook')}
            className="p-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                <BookMarked className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                Sürgü
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-800">Defter Kontrolü</h4>
              <p className="text-xs text-slate-600 mt-0.5">Yüzdesel slider ile defter durumunu gir</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('quiz-hw')}
            className="p-4 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                Notlar
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-sky-800">Quiz & Ödev Takip</h4>
              <p className="text-xs text-slate-600 mt-0.5">Quiz notları gir, ödev kontrolü yap</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="p-4 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                Hesapla
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-800">Dönem Sonu Puanı</h4>
              <p className="text-xs text-slate-600 mt-0.5">Ağırlıklı performans notu & Excel indir</p>
            </div>
          </button>
        </div>
      </div>

      {/* Class Student Management & Bulk Import Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Öğrenci Yönetimi ({currentClass?.name})</h4>
            <p className="text-xs text-slate-500">Tekil veya toplu Excel ile öğrenci bilgisi yükleyin</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenAddStudent}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Öğrenci Ekle
            </button>
            <button
              onClick={onOpenBulkImport}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Toplu Yükle
            </button>
          </div>
        </div>

        {/* Student Quick List */}
        <div className="space-y-2 mt-2">
          {classStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Bu sınıfta henüz kayıtlı öğrenci yok. "Öğrenci Ekle" veya "Toplu Yükle" butonuyla öğrenci ekleyebilirsiniz.
            </div>
          ) : (
            classStudents.slice(0, 4).map((std) => {
              const score = studentScores.find((s) => s.studentId === std.id);
              return (
                <div
                  key={std.id}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={std.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(std.name + ' ' + std.surname)}&background=6366f1&color=fff`}
                      alt={std.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {std.number} - {std.name} {std.surname}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Veli: {std.parentName} ({std.parentPhone})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-indigo-700">
                      {score?.finalScore || 0} <span className="text-[10px] font-normal text-slate-400">puan</span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      +{score?.plusCount || 0} / -{score?.minusCount || 0}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {classStudents.length > 4 && (
            <button
              onClick={() => onNavigateTab('quick-score')}
              className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mt-1"
            >
              Tüm {classStudents.length} öğrenciyi görüntüle <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Teacher Smart Warnings & AI Recommendations */}
      {lowNotebookCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="text-xs font-bold text-amber-900">Defter Kontrolü Uyarısı</h5>
            <p className="text-xs text-amber-800 mt-0.5">
              Bu sınıfta <strong>{lowNotebookCount} öğrenci</strong> defter kontrolünde %60 tamlığın altındadır. Veli İletişim modülünden otomatik bildirim gönderebilirsiniz.
            </p>
            <button
              onClick={() => onNavigateTab('feedback')}
              className="mt-2 text-xs font-black text-amber-900 underline hover:text-amber-950"
            >
              Velilere Yapay Zeka Mesajı Gönder →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
