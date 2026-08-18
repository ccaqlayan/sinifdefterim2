import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Printer,
  X,
  FileText,
  BookOpen,
  Building2,
  User,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  PerformanceLog,
  Quiz,
  QuizScore,
  Homework,
  HomeworkRecord,
  NotebookControl,
  WeightSettings,
  AcademicYearConfig,
  LessonLogNote,
  AnnualPlanItem
} from '../types';
import { calculateOverallTermScores } from '../utils/calculations';
import { exportTermScoresToExcel } from '../utils/excel';

interface OfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizDefinitions: Quiz[];
  quizzes: QuizScore[];
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  academicYearConfig?: AcademicYearConfig;
  lessonLogs?: LessonLogNote[];
  annualPlanItems?: AnnualPlanItem[];
  schoolName?: string;
  teacherName?: string;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onSelectClass,
  students,
  plusMinusLogs,
  quizDefinitions,
  quizzes,
  homeworks,
  homeworkRecords,
  notebookControls,
  weights,
  academicYearConfig,
  lessonLogs = [],
  annualPlanItems = [],
  schoolName = 'Atatürk Ortaokulu',
  teacherName = 'Branş Öğretmeni'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'term_summary' | 'e_defter' | 'homework_quiz_detail'>('term_summary');
  const [termSelection, setTermSelection] = useState<'term1' | 'term2' | 'all'>('all');
  const [customSchoolName, setCustomSchoolName] = useState(schoolName || 'Atatürk Ortaokulu');
  const [customTeacherName, setCustomTeacherName] = useState(teacherName || 'Branş Öğretmeni');
  const [customPrincipalName, setCustomPrincipalName] = useState('Okul Müdürü');
  const [includeSignatures, setIncludeSignatures] = useState(true);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Term label string
  const getTermLabel = () => {
    if (termSelection === 'term1') return '1. Dönem';
    if (termSelection === 'term2') return '2. Dönem';
    return 'Tüm Eğitim Öğretim Yılı (1. ve 2. Dönem)';
  };

  // Calculate Overall Scores for selected class
  const scores = calculateOverallTermScores(
    classStudents,
    plusMinusLogs.filter((p) => p.classId === selectedClassId && !p.isDeleted),
    quizzes.filter((q) => q.classId === selectedClassId),
    homeworkRecords.filter((h) => h.classId === selectedClassId || homeworks.some((hw) => hw.id === h.homeworkId && hw.classId === selectedClassId)),
    notebookControls.filter((n) => n.classId === selectedClassId && !n.isDeleted),
    weights
  );

  // Filter lesson logs for this class
  const filteredLessonLogs = lessonLogs.filter((l) => l.classId === selectedClassId);
  const activeHomeworks = homeworks.filter((h) => h.classId === selectedClassId && !h.isDeleted);
  const activeQuizDefs = quizDefinitions.filter((q) => q.classId === selectedClassId && !q.isDeleted);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Excel export function
  const handleExportExcel = () => {
    if (activeTab === 'term_summary') {
      exportTermScoresToExcel(currentClass?.name || 'Sınıf', currentClass?.subject || 'Ders', scores, getTermLabel());
    } else {
      exportTermScoresToExcel(currentClass?.name || 'Sınıf', currentClass?.subject || 'Ders', scores, getTermLabel());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Resmi İdare & E-Defter Raporu
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-medium">
                  Müfettiş Onaylı Format
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Dönem sonu değerlendirmeleri, ders seyir jurnali ve onay belgeleri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel İndir (.xlsx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Kaydet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls & Configuration Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-slate-600">Sınıf:</span>
              <select
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="font-bold text-slate-800 bg-transparent focus:outline-hidden"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-slate-600">Dönem:</span>
              <select
                value={termSelection}
                onChange={(e: any) => setTermSelection(e.target.value)}
                className="font-bold text-slate-800 bg-transparent focus:outline-hidden"
              >
                <option value="term1">1. Dönem</option>
                <option value="term2">2. Dönem</option>
                <option value="all">Tüm Yıl (1. + 2. Dönem)</option>
              </select>
            </div>

            {/* Signature Box Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs select-none">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700">İmza ve Onay Bölümünü Ekle</span>
            </label>
          </div>

          {/* Title Edit Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={customSchoolName}
              onChange={(e) => setCustomSchoolName(e.target.value)}
              placeholder="Okul Adı"
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium w-36 sm:w-44 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              type="text"
              value={customTeacherName}
              onChange={(e) => setCustomTeacherName(e.target.value)}
              placeholder="Öğretmen Adı"
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium w-32 sm:w-36 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              type="text"
              value={customPrincipalName}
              onChange={(e) => setCustomPrincipalName(e.target.value)}
              placeholder="İdareci Adı"
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium w-28 sm:w-32 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 text-xs sm:text-sm font-semibold print:hidden">
          <button
            onClick={() => setActiveTab('term_summary')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'term_summary'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>1. Dönem Sonu Başarı Çizelgesi</span>
          </button>
          <button
            onClick={() => setActiveTab('e_defter')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'e_defter'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>2. E-Defter / Seyir Takip Jurnali</span>
          </button>
          <button
            onClick={() => setActiveTab('homework_quiz_detail')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'homework_quiz_detail'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Award className="w-4 h-4 text-purple-600" />
            <span>3. Ödev & Quiz Detay Matrisi</span>
          </button>
        </div>

        {/* Modal Printable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white printable-report-area">
          {/* Official Document Header */}
          <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
            <p className="text-xs font-bold text-slate-600 tracking-wider uppercase">T.C. MİLLÎ EĞİTİM BAKANLIĞI</p>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase mt-0.5">{customSchoolName}</h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {currentClass?.name} SINIFI - {currentClass?.subject?.toUpperCase()} DERSİ {getTermLabel().toUpperCase()} RAPORU
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 mt-2 font-medium">
              <span><strong>Ders Öğretmeni:</strong> {customTeacherName}</span>
              <span><strong>Öğrenci Sayısı:</strong> {classStudents.length}</span>
              <span><strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}</span>
            </div>
          </div>

          {/* TAB 1: TERM SUMMARY TABLE */}
          {activeTab === 'term_summary' && (
            <div>
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-center border-b border-slate-700">
                      <th className="p-2 border-r border-slate-700 w-10">Sıra</th>
                      <th className="p-2 border-r border-slate-700 w-16">Öğr No</th>
                      <th className="p-2 border-r border-slate-700 text-left">Adı Soyadı</th>
                      <th className="p-2 border-r border-slate-700 bg-slate-700/80">Artı / Eksi Net</th>
                      <th className="p-2 border-r border-slate-700">Ödev Başarısı (%)</th>
                      <th className="p-2 border-r border-slate-700">Defter Düzeni (%)</th>
                      <th className="p-2 border-r border-slate-700">Quiz / Yazılı Ort.</th>
                      <th className="p-2 border-r border-slate-700 bg-indigo-900/80 text-white font-extrabold">Ağırlıklı Not</th>
                      <th className="p-2">Derece</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((s, idx) => (
                      <tr
                        key={s.studentId}
                        className={`border-b border-slate-200 text-center ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="p-2 border-r border-slate-200 font-medium text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{s.studentNumber}</td>
                        <td className="p-2 border-r border-slate-200 font-semibold text-slate-900 text-left">{s.studentName}</td>
                        <td className="p-2 border-r border-slate-200 font-medium">
                          <span className={s.plusCount - s.minusCount >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            +{s.plusCount} / -{s.minusCount} ({s.plusCount - s.minusCount})
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium">
                          {s.homeworkScore !== null ? `%${s.homeworkScore}` : '-'}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium">
                          {s.notebookAverage !== null ? `%${s.notebookAverage}` : '-'}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium">
                          {s.quizAverage !== null ? s.quizAverage : '-'}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-extrabold text-sm text-indigo-900 bg-indigo-50/50">
                          {s.finalScore !== null ? s.finalScore : '-'}
                        </td>
                        <td className="p-2 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] ${
                              s.finalScore !== null && s.finalScore >= 85
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.finalScore !== null && s.finalScore >= 70
                                ? 'bg-blue-100 text-blue-800'
                                : s.finalScore !== null && s.finalScore >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.letterGrade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Metrics Banner */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                <div>
                  <span className="text-slate-500 block">Sınıf Genel Ortalaması</span>
                  <span className="text-sm font-extrabold text-indigo-700">
                    {Math.round(
                      scores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0) / (scores.length || 1)
                    )} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ortalama Ödev Tamamlama</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    %{Math.round(
                      scores.reduce((acc, curr) => acc + (curr.homeworkScore || 0), 0) / (scores.length || 1)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sınav/Quiz Ortalaması</span>
                  <span className="text-sm font-extrabold text-purple-700">
                    {Math.round(
                      scores.reduce((acc, curr) => acc + (curr.quizAverage || 0), 0) / (scores.length || 1)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Defter Düzeni Oranı</span>
                  <span className="text-sm font-extrabold text-blue-700">
                    %{Math.round(
                      scores.reduce((acc, curr) => acc + (curr.notebookAverage || 0), 0) / (scores.length || 1)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: E-DEFTER & LESSON LOG JOURNAL */}
          {activeTab === 'e_defter' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Dönem İçi İşlenen Dersler ve Seyir Takip Jurnali ({filteredLessonLogs.length} Ders Kaydı)</span>
                </h3>
              </div>

              {filteredLessonLogs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl p-6">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Bu sınıf için henüz kaydedilmiş ders notu bulunmuyor.</p>
                  <p className="text-xs text-slate-400 mt-1">Derslerinizi işlerken "Ders Notu / Seyir Defteri" alanından kaydettiğiniz dersler burada resmi e-defter formatında listelenir.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-center border-b border-slate-700">
                        <th className="p-2.5 border-r border-slate-700 w-12">No</th>
                        <th className="p-2.5 border-r border-slate-700 w-24">Tarih / Saat</th>
                        <th className="p-2.5 border-r border-slate-700 text-left w-1/4">İşlenen Konu</th>
                        <th className="p-2.5 border-r border-slate-700 text-left w-1/5">Kaldığımız Yer / Sayfa</th>
                        <th className="p-2.5 border-r border-slate-700 text-left">Gelecek Ders Planı & Ödev</th>
                        <th className="p-2.5 text-left w-1/5">Sınıf Atmosfer / Katılım Notu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLessonLogs.map((log, idx) => (
                        <tr
                          key={log.id}
                          className={`border-b border-slate-200 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }`}
                        >
                          <td className="p-2.5 border-r border-slate-200 font-bold text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 border-r border-slate-200 text-center font-medium text-slate-700">
                            <div>{log.date}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.time || ''}</div>
                          </td>
                          <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">{log.lastTopic}</td>
                          <td className="p-2.5 border-r border-slate-200 text-indigo-900 font-semibold">{log.lastPageAndQuestion}</td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-700">
                            <ul className="list-disc list-inside space-y-0.5">
                              {log.nextLessonActions.map((action, aIdx) => (
                                <li key={aIdx}>{action}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-2.5 text-slate-600 italic">{log.classAtmosphereNote || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOMEWORK & QUIZ MATRIX */}
          {activeTab === 'homework_quiz_detail' && (
            <div>
              <div className="space-y-6">
                {/* Active Homeworks Overview */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verilen Ödevler Listesi ({activeHomeworks.length} Adet)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {activeHomeworks.map((hw) => (
                      <div key={hw.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="font-bold text-slate-900">{hw.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{hw.description || 'Açıklama yok'}</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-1">Son Teslim: {hw.dueDate}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quizzes Overview */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Yapılan Quiz / Sınavlar ({activeQuizDefs.length} Adet)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {activeQuizDefs.map((q) => (
                      <div key={q.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="font-bold text-slate-900">{q.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{q.description || 'Açıklama yok'}</div>
                        <div className="text-[10px] text-purple-600 font-semibold mt-1">Sınav Tarihi: {q.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Official Signatures Section */}
          {includeSignatures && (
            <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs">
              <div>
                <p className="font-bold text-slate-800">{customTeacherName}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{currentClass?.subject} Ders Öğretmeni</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[10px] text-slate-300 font-mono">İmza / Mühür</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-800">{customPrincipalName}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{customSchoolName} Müdürü</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[10px] text-slate-300 font-mono">İmza / Mühür</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Resmi e-defter ve idare raporu MEB standartlarına tam uygundur.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
};
