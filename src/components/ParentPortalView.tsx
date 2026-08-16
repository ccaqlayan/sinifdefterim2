import React, { useState, useEffect } from 'react';
import { Student, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, WeightSettings, ClassRoom, User } from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { ShieldCheck, BookMarked, Award, CheckCircle2, Sparkles, UserCheck, HeartHandshake } from 'lucide-react';

interface ParentPortalViewProps {
  user: User;
  students: Student[];
  classes: ClassRoom[];
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  user,
  students,
  classes,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  weights,
}) => {
  // Find child student
  const childStudent = students.find((s) => s.id === user.childStudentId) || students[0];
  const childClass = classes.find((c) => c.id === childStudent?.classId) || classes[0];

  const score = childStudent
    ? calculateStudentOverallScore(childStudent, plusMinusLogs, quizzes, homeworkRecords, notebookControls, weights)
    : null;

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);

  useEffect(() => {
    if (!childStudent || !score || !childClass) return;

    const fetchAdvice = async () => {
      setIsLoadingAdvice(true);
      try {
        const res = await fetch('/api/gemini/student-advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: childStudent.name,
            subject: childClass.subject,
            finalScore: score.finalScore,
            stats: {
              plusCount: score.plusCount,
              minusCount: score.minusCount,
              notebookAvg: score.notebookAverage,
              quizAvg: score.quizAverage,
            },
          }),
        });
        const data = await res.json();
        if (data.text) setAiAdvice(data.text);
      } catch (e) {
        setAiAdvice(
          `${childStudent.name}, ${childClass.subject} dersinde ders katılımında başarılıdır. Defter düzenini koruyarak puanını yüksek tutabilir.`
        );
      } finally {
        setIsLoadingAdvice(false);
      }
    };

    fetchAdvice();
  }, [childStudent?.id]);

  if (!childStudent) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        Öğrenci kaydı bulunamadı.
      </div>
    );
  }

  const studentLogs = plusMinusLogs.filter((l) => l.studentId === childStudent.id);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Student Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3">
          <img
            src={
              childStudent.photoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                childStudent.name + ' ' + childStudent.surname
              )}&background=6366f1&color=fff`
            }
            alt={childStudent.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400/30 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-400/20">
                {childClass?.name} ({childClass?.subject})
              </span>
            </div>
            <h2 className="text-xl font-black mt-0.5">
              {childStudent.name} {childStudent.surname}
            </h2>
            <p className="text-xs text-indigo-200">Veli Takip Paneli (#{childStudent.number})</p>
          </div>
        </div>

        {/* Big Overall Term Grade */}
        <div className="mt-4 pt-4 border-t border-indigo-700/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-indigo-200 font-medium">Dönem Performans Notu</p>
            <p className="text-xs text-amber-300 font-bold">{score?.letterGrade || 'Veri Yok'}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-white">{score?.finalScore !== null && score?.finalScore !== undefined ? score.finalScore : '-'}</span>
            {score?.finalScore !== null && score?.finalScore !== undefined && <span className="text-xs text-indigo-200 font-normal"> / 100</span>}
          </div>
        </div>
      </div>

      {/* AI Pedagogical Teacher Note */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 space-y-2 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600" /> Yapay Zeka Öğretmen & Rehberlik Analizi
        </div>
        <p className="text-xs text-amber-950 leading-relaxed font-medium">
          {isLoadingAdvice ? 'Analiz yükleniyor...' : aiAdvice}
        </p>
      </div>

      {/* Academic Pillars Progress Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Sınıf İçi Katılım</span>
            <span className="text-emerald-600">+{score?.plusCount} / -{score?.minusCount}</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {score?.plusMinusNormalized !== null && score?.plusMinusNormalized !== undefined ? score.plusMinusNormalized : '-'}{' '}
            {score?.plusMinusNormalized !== null && score?.plusMinusNormalized !== undefined && <span className="text-xs text-slate-400 font-normal">/100</span>}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${score?.plusMinusNormalized ?? 0}%` }} className="h-full bg-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Quiz Ortalaması</span>
            <span className="text-indigo-600">Sınavlar</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {score?.quizAverage !== null && score?.quizAverage !== undefined ? score.quizAverage : '-'}{' '}
            {score?.quizAverage !== null && score?.quizAverage !== undefined && <span className="text-xs text-slate-400 font-normal">/100</span>}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${score?.quizAverage ?? 0}%` }} className="h-full bg-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Ödev Takip Puanı</span>
            <span className="text-sky-600">Teslimler</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {score?.homeworkScore !== null && score?.homeworkScore !== undefined ? score.homeworkScore : '-'}{' '}
            {score?.homeworkScore !== null && score?.homeworkScore !== undefined && <span className="text-xs text-slate-400 font-normal">/100</span>}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${score?.homeworkScore ?? 0}%` }} className="h-full bg-sky-500" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Defter Düzeni</span>
            <span className="text-amber-600">Kontrol</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {score?.notebookAverage !== null && score?.notebookAverage !== undefined ? `%${score.notebookAverage}` : '-'}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${score?.notebookAverage ?? 0}%` }} className="h-full bg-amber-500" />
          </div>
        </div>
      </div>

      {/* Class Plus / Minus History */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Son Ders Değerlendirmeleri ({studentLogs.length})
        </h3>

        {studentLogs.length === 0 ? (
          <p className="text-xs text-slate-400">Henüz değerlendirme bulunmuyor.</p>
        ) : (
          <div className="space-y-1.5">
            {studentLogs.slice(-5).reverse().map((log) => (
              <div key={log.id} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      log.type === 'plus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {log.type === 'plus' ? '+ Artı' : '- Eksi'}
                  </span>
                  <span className="font-extrabold text-slate-800">{log.category}</span>
                  {log.note && <span className="text-slate-500 italic">({log.note})</span>}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{log.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
