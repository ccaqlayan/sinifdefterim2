import React, { useState, useEffect } from 'react';
import { 
  Student, PerformanceLog, QuizScore, Homework, HomeworkRecord, 
  NotebookControl, WeightSettings, ClassRoom, HomeworkStatus 
} from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { 
  Award, BookOpen, PlusCircle, MinusCircle, Clock, X, Check, 
  CheckCircle2, FileText, Calendar, Phone, Mail, User, BookMarked, Sparkles
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
}

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
}) => {
  const [activeDetailTab, setActiveDetailTab] = useState<'homework' | 'quiz' | 'plusminus' | 'notebook'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveDetailTab(initialTab);
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
  const studentLogs = plusMinusLogs.filter((p) => p.studentId === student.id);
  const studentNotebooks = notebookControls.filter((n) => n.studentId === student.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={
                student.photoUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  student.name + ' ' + student.surname
                )}&background=6366f1&color=fff`
              }
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                  #{student.number}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {student.name} {student.surname}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {currentClass.name} ({currentClass.subject}) • Veli: {student.parentName || 'Girilmedi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-all cursor-pointer"
            title="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Overall Score Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-2xl p-3.5 text-center shadow-xs flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-indigo-200 font-black uppercase tracking-wider">Genel Dönem Başarı Notu</p>
              <p className="text-xs text-indigo-100 font-bold mt-0.5">{score.letterGrade}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{score.finalScore}</span>
              <span className="text-xs text-indigo-200 font-medium"> / 100</span>
            </div>
          </div>

          {/* Interactive Criteria Cards (Selectable Tabs) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
              İncelemek İstediğiniz Alanı Seçin:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Defter Card */}
              <button
                onClick={() => setActiveDetailTab('notebook')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'notebook'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-50/80 text-amber-950 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <BookMarked className="w-4 h-4" />
                  <span className="text-[10px] font-bold opacity-80">%{weights.notebookWeight}</span>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] font-extrabold uppercase opacity-90">Defter Düzeni</div>
                  <div className="text-base font-black">%{score.notebookAverage}</div>
                </div>
              </button>

              {/* Katılım Card */}
              <button
                onClick={() => setActiveDetailTab('plusminus')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'plusminus'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                    : 'bg-emerald-50/80 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <PlusCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold opacity-80">%{weights.plusMinusWeight}</span>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] font-extrabold uppercase opacity-90">Derse Katılım</div>
                  <div className="text-base font-black">+{score.plusCount} / -{score.minusCount}</div>
                </div>
              </button>

              {/* Quiz Card */}
              <button
                onClick={() => setActiveDetailTab('quiz')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'quiz'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                    : 'bg-indigo-50/80 text-indigo-950 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Award className="w-4 h-4" />
                  <span className="text-[10px] font-bold opacity-80">%{weights.quizWeight}</span>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] font-extrabold uppercase opacity-90">Quiz / Sınav</div>
                  <div className="text-base font-black">{score.quizAverage}</div>
                </div>
              </button>

              {/* Ödev Card */}
              <button
                onClick={() => setActiveDetailTab('homework')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeDetailTab === 'homework'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                    : 'bg-sky-50/80 text-sky-950 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[10px] font-bold opacity-80">%{weights.homeworkWeight}</span>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] font-extrabold uppercase opacity-90">Ödev Takip</div>
                  <div className="text-base font-black">%{score.homeworkScore}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Detailed Breakdown Container */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
            {/* 1. DEFTER KONTROL DETAYI */}
            {activeDetailTab === 'notebook' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase">
                    <BookMarked className="w-4 h-4 text-amber-600" /> Defter Kontrol İnceleme Geçmişi ({studentNotebooks.length})
                  </h4>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                    Ortalama: %{score.notebookAverage}
                  </span>
                </div>

                {studentNotebooks.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    Henüz defter kontrolü kaydedilmemiş.
                  </div>
                ) : (
                  [...studentNotebooks].reverse().map((nb) => (
                    <div
                      key={nb.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{nb.date}</span>
                        </div>
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
                            ? `Eksik Var (%${nb.percentage})`
                            : `Yok / Boş (%${nb.percentage})`}
                        </span>
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

            {/* 2. KATILIM (ARTI/EKSİ) DETAYI */}
            {activeDetailTab === 'plusminus' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase">
                    <PlusCircle className="w-4 h-4 text-emerald-600" /> Derse Katılım Artı / Eksi Kayıtları ({studentLogs.length})
                  </h4>
                  <div className="flex items-center gap-1 text-xs font-black">
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                      +{score.plusCount} Artı
                    </span>
                    <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                      -{score.minusCount} Eksi
                    </span>
                  </div>
                </div>

                {studentLogs.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    Henüz katılım (artı/eksi) verisi kaydedilmemiş.
                  </div>
                ) : (
                  [...studentLogs].reverse().map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
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

                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                          log.type === 'plus'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {log.type === 'plus' ? '+1 Puan' : '-1 Puan'}
                      </span>
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
    </div>
  );
};
