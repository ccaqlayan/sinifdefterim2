import React, { useState } from 'react';
import { Student, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, WeightSettings, ClassRoom, OverallTermScore } from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { exportTermScoresToExcel } from '../utils/excel';
import { Award, Download, Sliders, TrendingUp, Sparkles, ChevronRight, User, CheckCircle2 } from 'lucide-react';

interface ReportsViewProps {
  currentClass: ClassRoom;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  onUpdateWeights: (weights: WeightSettings) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentClass,
  students,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  weights,
  onUpdateWeights,
}) => {
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [selectedStudentScore, setSelectedStudentScore] = useState<OverallTermScore | null>(null);

  const classStudents = students.filter((s) => s.classId === currentClass.id);

  // Calculate scores for all students
  const studentScores = classStudents.map((std) =>
    calculateStudentOverallScore(std, plusMinusLogs, quizzes, homeworkRecords, notebookControls, weights)
  );

  // Sort by final score descending
  studentScores.sort((a, b) => b.finalScore - a.finalScore);

  const handleWeightChange = (key: keyof WeightSettings, val: number) => {
    const updated = { ...weights, [key]: val };
    // Ensure total sum stays 100% logic or alert user
    onUpdateWeights(updated);
  };

  const totalWeight = weights.quizWeight + weights.plusMinusWeight + weights.homeworkWeight + weights.notebookWeight;

  const handleExportExcel = () => {
    exportTermScoresToExcel(currentClass.name, currentClass.subject, studentScores);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Banner & Export Action */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Dönem Sonu Performans Raporu</h3>
              <p className="text-xs text-indigo-200">{currentClass.name} - {currentClass.subject}</p>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Excel Dışa Aktar
          </button>
        </div>

        {/* Weights Summary Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-200 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Etki Yüzdeleri Dağılımı:
            </span>
            <button
              onClick={() => setShowWeightSettings(!showWeightSettings)}
              className="text-[11px] font-black text-amber-300 underline hover:text-amber-200"
            >
              {showWeightSettings ? 'Kapat' : 'Etki Yüzdelerini Değiştir (%' + totalWeight + ')'}
            </button>
          </div>

          <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800">
            <div style={{ width: `${weights.quizWeight}%` }} className="bg-indigo-500" title="Quiz %" />
            <div style={{ width: `${weights.plusMinusWeight}%` }} className="bg-emerald-500" title="Artı/Eksi %" />
            <div style={{ width: `${weights.homeworkWeight}%` }} className="bg-sky-500" title="Ödev %" />
            <div style={{ width: `${weights.notebookWeight}%` }} className="bg-amber-500" title="Defter %" />
          </div>

          <div className="grid grid-cols-4 text-[10px] text-center font-bold text-indigo-200">
            <span>Quiz: %{weights.quizWeight}</span>
            <span>Katılım: %{weights.plusMinusWeight}</span>
            <span>Ödev: %{weights.homeworkWeight}</span>
            <span>Defter: %{weights.notebookWeight}</span>
          </div>
        </div>
      </div>

      {/* Customizable Weight Settings Panel */}
      {showWeightSettings && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Ağırlıklı Etki Yüzdelerini Ayarla
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
        </div>
      )}

      {/* Student Term Performance Table Cards */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Öğrenci Not Listesi ({studentScores.length})
        </h4>

        {studentScores.map((score, index) => {
          const student = students.find((s) => s.id === score.studentId);

          return (
            <div
              key={score.studentId}
              onClick={() => setSelectedStudentScore(score)}
              className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <img
                    src={
                      student?.photoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        score.studentName
                      )}&background=6366f1&color=fff`
                    }
                    alt={score.studentName}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">
                      #{score.studentNumber} {score.studentName}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {score.letterGrade}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-xs">
                    {score.finalScore} <span className="text-[10px] font-normal opacity-80">/100</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Progress Bars breakdown */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[10px]">
                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Quiz</span>
                    <span className="text-slate-800">{score.quizAverage}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.quizAverage}%` }} className="h-full bg-indigo-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Katılım</span>
                    <span className="text-emerald-700">{score.plusMinusNormalized}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.plusMinusNormalized}%` }} className="h-full bg-emerald-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Ödev</span>
                    <span className="text-sky-700">{score.homeworkScore}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.homeworkScore}%` }} className="h-full bg-sky-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Defter</span>
                    <span className="text-amber-700">{score.notebookAverage}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div style={{ width: `${score.notebookAverage}%` }} className="h-full bg-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Detail Performance Breakdown Modal */}
      {selectedStudentScore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {selectedStudentScore.studentName}
                </h3>
                <p className="text-xs text-slate-500">Dönem Sonu Karnesi & Not Analizi</p>
              </div>
              <button
                onClick={() => setSelectedStudentScore(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-600 text-white rounded-xl p-4 text-center">
              <p className="text-xs text-indigo-200 font-bold uppercase">Hesaplanan Dönem Sonu Performans Puanı</p>
              <p className="text-3xl font-black mt-1">{selectedStudentScore.finalScore} / 100</p>
              <p className="text-xs text-indigo-100 font-semibold mt-0.5">{selectedStudentScore.letterGrade}</p>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Quiz / Sınav Notu Ortalaması:</span>
                <span className="font-bold text-indigo-700">{selectedStudentScore.quizAverage} (100 üzerinden)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Derse Katılım (+/{selectedStudentScore.plusCount} -/{selectedStudentScore.minusCount}):</span>
                <span className="font-bold text-emerald-700">{selectedStudentScore.plusMinusNormalized} (100 üzerinden)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Ödev Tamamlama Başarısı:</span>
                <span className="font-bold text-sky-700">{selectedStudentScore.homeworkScore} (100 üzerinden)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span>Defter Kontrol Ortalaması:</span>
                <span className="font-bold text-amber-700">%{selectedStudentScore.notebookAverage}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentScore(null)}
              className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
