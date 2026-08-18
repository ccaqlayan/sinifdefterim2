import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  MessageSquare,
  User,
  Phone,
  Calendar,
  Save,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  Send,
  HeartHandshake
} from 'lucide-react';
import { Student, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, ParentMeetingLog } from '../types';

interface ParentMeetingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedStudentId?: string;
  onSelectStudentId?: (id: string) => void;
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  parentMeetingLogs: ParentMeetingLog[];
  onSaveParentMeetingLog: (log: ParentMeetingLog) => void;
  subjectName?: string;
}

export const ParentMeetingSummaryModal: React.FC<ParentMeetingSummaryModalProps> = ({
  isOpen,
  onClose,
  students,
  selectedStudentId,
  onSelectStudentId,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  parentMeetingLogs,
  onSaveParentMeetingLog,
  subjectName = 'Matematik & Fen'
}) => {
  if (!isOpen) return null;

  const currentStudentId = selectedStudentId || students[0]?.id || '';
  const currentStudent = students.find((s) => s.id === currentStudentId) || students[0];

  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [tone, setTone] = useState<'encouraging' | 'balanced' | 'focus_needed'>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  // New Meeting Log Inputs
  const [parentName, setParentName] = useState(currentStudent?.parentName || '');
  const [actionTaken, setActionTaken] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Calculate Student Stats
  const studentPlusLogs = plusMinusLogs.filter((p) => p.studentId === currentStudentId && p.type === 'plus' && !p.isDeleted);
  const studentMinusLogs = plusMinusLogs.filter((p) => p.studentId === currentStudentId && p.type === 'minus' && !p.isDeleted);
  
  const studentQuizzes = quizzes.filter((q) => q.studentId === currentStudentId && q.score !== undefined);
  const quizAvg = studentQuizzes.length > 0
    ? Math.round(studentQuizzes.reduce((acc, curr) => acc + curr.score, 0) / studentQuizzes.length)
    : 80;

  const studentHwRecs = homeworkRecords.filter((h) => h.studentId === currentStudentId);
  const completedHws = studentHwRecs.filter((h) => h.status === 'completed' || h.status === 'done');
  const hwRate = studentHwRecs.length > 0
    ? Math.round((completedHws.length / studentHwRecs.length) * 100)
    : 85;

  const studentNotebooks = notebookControls.filter((n) => n.studentId === currentStudentId && !n.isDeleted);
  const notebookAvg = studentNotebooks.length > 0
    ? Math.round(studentNotebooks.reduce((acc, curr) => acc + (curr.percentage || 80), 0) / studentNotebooks.length)
    : 85;

  // Past logs for this student
  const studentPastLogs = parentMeetingLogs.filter((l) => l.studentId === currentStudentId);

  // Handle AI Summary Generation
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/gemini/parent-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: `${currentStudent.name} ${currentStudent.surname}`,
          subject: subjectName,
          plusCount: studentPlusLogs.length,
          minusCount: studentMinusLogs.length,
          notebookAvg,
          homeworkRate: hwRate,
          quizAvg,
          customNote: currentStudent.notes || ''
        }),
      });

      const data = await response.json();
      if (data.text) {
        setGeneratedText(data.text);
      } else {
        setGeneratedText(`Sayın Velimiz, ${currentStudent.name} isimli öğrencimizin ${subjectName} dersindeki ders içi gayreti için teşekkür ederiz. Ödev takibi %${hwRate} seviyesinde olup düzenli çalışmayla başarısının artacağına inanıyoruz.`);
      }
    } catch (err) {
      console.error("AI Parent Feedback Error:", err);
      setGeneratedText(`Sayın Velimiz, ${currentStudent.name} isimli öğrencimizin ${subjectName} dersi takibinde net ${studentPlusLogs.length - studentMinusLogs.length} artı hakkı ve %${hwRate} ödev başarısı bulunmaktadır. Gayreti için tebrik ederiz.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send via WhatsApp
  const handleWhatsApp = () => {
    const rawPhone = (currentStudent.parentPhone || '').replace(/\D/g, '');
    const phoneWithCountry = rawPhone.startsWith('90') ? rawPhone : `90${rawPhone}`;
    const encodedText = encodeURIComponent(generatedText);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodedText}`, '_blank');
  };

  // Save to Parent Meeting Logs
  const handleSaveLog = () => {
    if (!generatedText) return;

    const newLog: ParentMeetingLog = {
      id: `pml-${Date.now()}`,
      studentId: currentStudent.id,
      classId: currentStudent.classId,
      date: new Date().toISOString().slice(0, 10),
      parentName: parentName || currentStudent.parentName || 'Veli',
      summary: generatedText,
      tone,
      actionTaken: actionTaken || 'Öğrenci gelişim hedefleri veli ile paylaşıldı.',
      createdAt: new Date().toISOString(),
    };

    onSaveParentMeetingLog(newLog);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <HeartHandshake className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Veli Toplantısı ve Gelişim Özeti Asistanı</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                AI destekli 3 cümlelik pedagojik veli bilgilendirmesi ve görüşme kaydı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Öğrenci Seçin:</span>
            <select
              value={currentStudentId}
              onChange={(e) => onSelectStudentId && onSelectStudentId(e.target.value)}
              className="font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  No: {s.number} - {s.name} {s.surname}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Veli: <strong>{currentStudent?.parentName || 'Belirtilmedi'}</strong> ({currentStudent?.parentPhone || '-'})</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'generator'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Veli Özeti Oluştur</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Geçmiş Görüşme Notları ({studentPastLogs.length})</span>
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'generator' ? (
            <div className="space-y-4">
              {/* Performance Indicator Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Artı / Eksi Dengesi</span>
                  <span className="text-sm font-extrabold text-indigo-700 mt-0.5 block">
                    +{studentPlusLogs.length} / -{studentMinusLogs.length}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Ödev Tamamlama</span>
                  <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                    %{hwRate}
                  </span>
                </div>
                <div className="p-2.5 bg-purple-50/60 border border-purple-100 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Quiz Ortalaması</span>
                  <span className="text-sm font-extrabold text-purple-700 mt-0.5 block">
                    {quizAvg}/100
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                  <span className="text-slate-500 text-[10px] block">Defter Kontrolü</span>
                  <span className="text-sm font-extrabold text-blue-700 mt-0.5 block">
                    %{notebookAvg}
                  </span>
                </div>
              </div>

              {/* Tone Selection & Generate Button */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Mesaj Tonu:</span>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setTone('encouraging')}
                      className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                        tone === 'encouraging' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Teşvik Edici
                    </button>
                    <button
                      onClick={() => setTone('balanced')}
                      className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                        tone === 'balanced' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dengeli
                    </button>
                    <button
                      onClick={() => setTone('focus_needed')}
                      className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                        tone === 'focus_needed' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ödev Odaklı
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isGenerating ? 'AI Analiz Ediyor...' : 'AI Veli Özeti Üret'}</span>
                </button>
              </div>

              {/* Generated Text Area */}
              {generatedText ? (
                <div className="p-4 bg-slate-50 border border-indigo-200 rounded-2xl relative space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Oluşturulan 3 Cümlelik Veli Özeti
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Pedagojik ve Yapıcı Dili Entegre Edildi</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {generatedText}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copied ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
                      </button>

                      <button
                        onClick={handleWhatsApp}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp ile Gönder</span>
                      </button>
                    </div>

                    <button
                      onClick={handleSaveLog}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Görüşme Kaydedildi ✓' : 'Görüşme Notlarına Ekle'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Yukarıdaki "AI Veli Özeti Üret" butonuna basarak yapay zeka destekli pedagojik ozeti hazırlatabilirsiniz.</p>
                </div>
              )}

              {/* Quick Action Plan Field */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 block">Veli İle Alınan Ortak Karar / Aksiyon Planı (Opsiyonel):</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Örn: Hafta sonu 30 dakika günlük konu tekrarı yapılması kararlaştırıldı."
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: MEETING HISTORY */
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{currentStudent.name} {currentStudent.surname} İçin Geçmiş Görüşmeler</span>
              </h3>

              {studentPastLogs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl p-6">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Henüz veli görüşme kaydı bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {studentPastLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-900">Veli: {log.parentName || 'Veli'}</span>
                        <span className="text-slate-400 font-mono">{log.date}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{log.summary}</p>
                      {log.actionTaken && (
                        <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-medium">
                          <strong>Aksiyon Planı:</strong> {log.actionTaken}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Öğrenci verileri güvenli ve yerel kaydedilir.</span>
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
