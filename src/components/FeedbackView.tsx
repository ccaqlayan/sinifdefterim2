import React, { useState } from 'react';
import { Student, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, NotificationSetting, ParentFeedbackLog, ClassRoom, WeightSettings } from '../types';
import { calculateStudentOverallScore } from '../utils/calculations';
import { MessageSquare, Sparkles, Send, Bell, Settings, Share2, CheckCircle2, Copy } from 'lucide-react';

interface FeedbackViewProps {
  currentClass: ClassRoom;
  students: Student[];
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  weights: WeightSettings;
  notifications: NotificationSetting[];
  onUpdateNotifications: (notifications: NotificationSetting[]) => void;
  feedbackLogs: ParentFeedbackLog[];
  onAddFeedbackLog: (log: Omit<ParentFeedbackLog, 'id'>) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  currentClass,
  students,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  weights,
  notifications,
  onUpdateNotifications,
  feedbackLogs,
  onAddFeedbackLog,
}) => {
  const classStudents = students.filter((s) => s.classId === currentClass.id);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const [customTeacherNote, setCustomTeacherNote] = useState('');
  const [generatedAiMessage, setGeneratedAiMessage] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'message' | 'rules' | 'history'>('message');

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || classStudents[0];

  const studentScore = selectedStudent
    ? calculateStudentOverallScore(selectedStudent, plusMinusLogs, quizzes, homeworkRecords, notebookControls, weights)
    : null;

  const handleGenerateMessage = async () => {
    if (!selectedStudent || !studentScore) return;
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/gemini/parent-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: `${selectedStudent.name} ${selectedStudent.surname}`,
          subject: currentClass.subject,
          plusCount: studentScore.plusCount,
          minusCount: studentScore.minusCount,
          notebookAvg: studentScore.notebookAverage,
          homeworkRate: studentScore.homeworkScore,
          quizAvg: studentScore.quizAverage,
          customNote: customTeacherNote,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setGeneratedAiMessage(data.text);
      }
    } catch (e) {
      console.error(e);
      setGeneratedAiMessage(
        `Sayın Velimiz, ${selectedStudent.name}'in ${currentClass.subject} dersinde defter tamlık oranı %${studentScore?.notebookAverage}, quiz ortalaması ${studentScore?.quizAverage} düzeyindedir.`
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSendChannel = (channel: 'whatsapp' | 'sms' | 'email') => {
    if (!selectedStudent || !generatedAiMessage) return;

    onAddFeedbackLog({
      studentId: selectedStudent.id,
      parentPhone: selectedStudent.parentPhone,
      message: generatedAiMessage,
      channel,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sentBy: 'Mert Öğretmen',
    });

    const encodedText = encodeURIComponent(generatedAiMessage);

    if (channel === 'whatsapp') {
      const cleanPhone = selectedStudent.parentPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
    } else if (channel === 'sms') {
      window.open(`sms:${selectedStudent.parentPhone}?body=${encodedText}`, '_blank');
    } else {
      navigator.clipboard.writeText(generatedAiMessage);
      alert('Veli bildirim metni panoya kopyalandı!');
    }
  };

  const handleToggleNotificationRule = (ruleId: string) => {
    const updated = notifications.map((n) => (n.id === ruleId ? { ...n, enabled: !n.enabled } : n));
    onUpdateNotifications(updated);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Tab Switcher */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 font-bold text-xs">
        <button
          onClick={() => setActiveTab('message')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'message'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" /> Yapay Zeka Mesajı
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rules'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-600" /> Bildirim Kuralları
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" /> Gönderim Geçmişi
        </button>
      </div>

      {activeTab === 'message' ? (
        <div className="space-y-4">
          {/* AI Message Form */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Velilermize Geri Bildirim Oluştur
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Öğrenci Seçin:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {classStudents.map((std) => (
                  <option key={std.id} value={std.id}>
                    #{std.number} {std.name} {std.surname} (Veli: {std.parentName})
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
                <div className="font-extrabold text-indigo-950">
                  {selectedStudent.name} için Mevcut Veriler:
                </div>
                <div className="text-indigo-800 grid grid-cols-2 gap-1 font-medium">
                  <span>
                    Net Artı/Eksi: +{studentScore?.plusCount} / -{studentScore?.minusCount}
                  </span>
                  <span>Defter Tamlık: %{studentScore?.notebookAverage}</span>
                  <span>Quiz Ortalaması: {studentScore?.quizAverage}</span>
                  <span>Ödev Başarısı: %{studentScore?.homeworkScore}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Eklemek İstediğiniz Özel Not (İsteğe Bağlı):</label>
              <input
                type="text"
                placeholder="Örn: Bu hafta sınav çalışma sorularına odaklanmasını rica ederiz."
                value={customTeacherNote}
                onChange={(e) => setCustomTeacherNote(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerateMessage}
              disabled={isAiGenerating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isAiGenerating ? 'Yapay Zeka Mesaj Taslağı Hazırlıyor...' : 'Gemini AI Mesaj Oluştur'}
            </button>
          </div>

          {/* Generated Message Display & Share Buttons */}
          {generatedAiMessage && (
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs space-y-3 animate-in fade-in duration-150">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hazırlanan Veli Bildirim Mesajı:
              </h4>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                {generatedAiMessage}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSendChannel('whatsapp')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" /> WhatsApp ile Gönder
                </button>

                <button
                  onClick={() => handleSendChannel('sms')}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> SMS ile Gönder
                </button>

                <button
                  onClick={() => handleSendChannel('email')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center"
                  title="Metni Kopyala"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'rules' ? (
        /* Notification Rules Configuration Panel */
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-600" /> Özelleştirilebilir Bildirim Kuralları
            </h3>
            <p className="text-xs text-slate-500">
              Sisteminiz belirli kritik eşikler aşıldığında size veya veliye otomatik uyarılarda bulunur.
            </p>
          </div>

          <div className="space-y-2">
            {notifications.map((rule) => (
              <div
                key={rule.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{rule.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rule.template}</p>
                </div>

                <button
                  onClick={() => handleToggleNotificationRule(rule.id)}
                  className={`w-11 h-6 rounded-full transition-all relative p-0.5 shrink-0 ${
                    rule.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-all shadow-xs ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Send History Logs */
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Gönderilen Veli Mesajları Kaydı ({feedbackLogs.length})
          </h3>

          {feedbackLogs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Henüz velilere mesaj gönderilmedi.
            </div>
          ) : (
            <div className="space-y-2">
              {feedbackLogs.map((log) => {
                const std = students.find((s) => s.id === log.studentId);
                return (
                  <div key={log.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">
                        {std ? `${std.name} ${std.surname}` : 'Öğrenci'} ({log.parentPhone})
                      </span>
                      <span className="text-[10px] bg-slate-100 font-bold text-slate-600 px-2 py-0.5 rounded-full uppercase">
                        {log.channel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">{log.message}</p>
                    <div className="text-[10px] text-slate-400 text-right font-medium">{log.sentAt}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
