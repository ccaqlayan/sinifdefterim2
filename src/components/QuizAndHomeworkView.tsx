import React, { useState } from 'react';
import { Student, QuizScore, Homework, HomeworkRecord, ClassRoom, HomeworkStatus } from '../types';
import { Award, BookOpen, Plus, Sparkles, CheckCircle2, AlertCircle, Clock, Check, X, Wand2 } from 'lucide-react';

interface QuizAndHomeworkViewProps {
  currentClass: ClassRoom;
  students: Student[];
  quizzes: QuizScore[];
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  onAddQuizScore: (score: Omit<QuizScore, 'id'>) => void;
  onAddHomework: (hw: Omit<Homework, 'id'>) => void;
  onUpdateHomeworkRecord: (record: Omit<HomeworkRecord, 'id'>) => void;
}

export const QuizAndHomeworkView: React.FC<QuizAndHomeworkViewProps> = ({
  currentClass,
  students,
  quizzes,
  homeworks,
  homeworkRecords,
  onAddQuizScore,
  onAddHomework,
  onUpdateHomeworkRecord,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'quizzes' | 'homeworks'>('quizzes');
  const classStudents = students.filter((s) => s.classId === currentClass.id);
  const classHomeworks = homeworks.filter((h) => h.classId === currentClass.id);

  // New Quiz state
  const [newQuizTitle, setNewQuizTitle] = useState('Quiz 3: Genel Tekrar');
  const [quizInputScores, setQuizInputScores] = useState<{ [studentId: string]: number }>({});

  // New Homework Modal State
  const [isAddHWOpen, setIsAddHWOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Selected active homework for tracking
  const [selectedHwId, setSelectedHwId] = useState<string>(classHomeworks[0]?.id || '');

  const handleSaveQuizBatch = () => {
    if (!newQuizTitle.trim()) {
      alert('Lütfen quiz başlığı yazınız.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    classStudents.forEach((std) => {
      const score = quizInputScores[std.id] !== undefined ? quizInputScores[std.id] : 85;
      onAddQuizScore({
        studentId: std.id,
        classId: currentClass.id,
        quizTitle: newQuizTitle,
        score: Math.min(100, Math.max(0, Number(score))),
        date,
      });
    });
    alert(`${newQuizTitle} notları eklendi!`);
  };

  const handleGenerateAiHomework = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/suggest-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentClass.subject,
          grade: currentClass.grade,
          topic: 'Dönem Sonu Pekiştirme ve Defter Özet Çalışması',
        }),
      });
      const data = await res.json();
      if (data.text) {
        setHwTitle(`${currentClass.subject} Haftalık Kazanım Ödevi`);
        setHwDesc(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;
    onAddHomework({
      classId: currentClass.id,
      title: hwTitle,
      description: hwDesc,
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: hwDueDate,
    });
    setHwTitle('');
    setHwDesc('');
    setIsAddHWOpen(false);
  };

  const getStudentQuizAverage = (studentId: string) => {
    const studentQuizzes = quizzes.filter((q) => q.studentId === studentId);
    if (studentQuizzes.length === 0) return '-';
    const sum = studentQuizzes.reduce((acc, q) => acc + q.score, 0);
    return Math.round(sum / studentQuizzes.length);
  };

  const getHomeworkRecordStatus = (hwId: string, studentId: string): HomeworkStatus => {
    const rec = homeworkRecords.find((r) => r.homeworkId === hwId && r.studentId === studentId);
    return rec ? rec.status : 'completed';
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Sub-tab Navigation */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 font-bold text-xs">
        <button
          onClick={() => setActiveSubTab('quizzes')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'quizzes'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-600" /> Quiz / Sınav Notu Girişi
        </button>
        <button
          onClick={() => setActiveSubTab('homeworks')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'homeworks'
              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-600" /> Ödev Takip Modülü
        </button>
      </div>

      {activeSubTab === 'quizzes' ? (
        <div className="space-y-4">
          {/* New Quiz Batch Title & Save */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Yeni Quiz / Sınav Gir
              </h3>
              <button
                onClick={handleSaveQuizBatch}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Toplu Notları Kaydet
              </button>
            </div>

            <input
              type="text"
              value={newQuizTitle}
              onChange={(e) => setNewQuizTitle(e.target.value)}
              placeholder="Sınav Adı (Örn: Quiz 1: Üslü İfadeler)"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {/* Student Quiz Input List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-2 border-b border-slate-100 px-1">
              <span>Öğrenci</span>
              <span>Sınav Notu (0-100) / Ort.</span>
            </div>

            {classStudents.map((student) => {
              const quizAvg = getStudentQuizAverage(student.id);
              const scoreVal = quizInputScores[student.id] ?? 85;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        student.photoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          student.name + ' ' + student.surname
                        )}&background=6366f1&color=fff`
                      }
                      alt={student.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {student.name} {student.surname}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">#{student.number}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      Ort: {quizAvg}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreVal}
                      onChange={(e) =>
                        setQuizInputScores({
                          ...quizInputScores,
                          [student.id]: Number(e.target.value),
                        })
                      }
                      className="w-16 text-center text-xs font-black py-1.5 px-1 bg-slate-100 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Homework Module */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Ödev Listesi ({classHomeworks.length})
            </h3>
            <button
              onClick={() => setIsAddHWOpen(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Yeni Ödev Tanımla
            </button>
          </div>

          {classHomeworks.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
              Bu sınıfa henüz verilen ödev bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select HW selector */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Kontrol Edilen Ödev:</label>
                <select
                  value={selectedHwId || classHomeworks[0]?.id}
                  onChange={(e) => setSelectedHwId(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-sky-50 border border-sky-200 text-sky-950 rounded-xl focus:outline-none"
                >
                  {classHomeworks.map((hw) => (
                    <option key={hw.id} value={hw.id}>
                      {hw.title} (Son Teslim: {hw.dueDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student HW Status Checklist */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
                {classStudents.map((student) => {
                  const activeHW = classHomeworks.find((h) => h.id === (selectedHwId || classHomeworks[0]?.id));
                  const status = activeHW ? getHomeworkRecordStatus(activeHW.id, student.id) : 'completed';

                  return (
                    <div
                      key={student.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            student.photoUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              student.name + ' ' + student.surname
                            )}&background=6366f1&color=fff`
                          }
                          alt={student.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="text-xs font-extrabold text-slate-900">
                          {student.name} {student.surname}
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      {activeHW && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              onUpdateHomeworkRecord({
                                homeworkId: activeHW.id,
                                studentId: student.id,
                                status: 'completed',
                                updatedAt: new Date().toISOString().slice(0, 10),
                              })
                            }
                            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                              status === 'completed'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Tamamlandı"
                          >
                            <Check className="w-3.5 h-3.5" /> Tam
                          </button>

                          <button
                            onClick={() =>
                              onUpdateHomeworkRecord({
                                homeworkId: activeHW.id,
                                studentId: student.id,
                                status: 'missing',
                                updatedAt: new Date().toISOString().slice(0, 10),
                              })
                            }
                            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                              status === 'missing'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Eksik"
                          >
                            <X className="w-3.5 h-3.5" /> Eksik
                          </button>

                          <button
                            onClick={() =>
                              onUpdateHomeworkRecord({
                                homeworkId: activeHW.id,
                                studentId: student.id,
                                status: 'late',
                                updatedAt: new Date().toISOString().slice(0, 10),
                              })
                            }
                            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                              status === 'late'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Geç Teslim"
                          >
                            <Clock className="w-3.5 h-3.5" /> Geç
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Homework Modal */}
      {isAddHWOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-600" /> Yeni Ödev Tanımla
              </h3>
              <button
                onClick={() => setIsAddHWOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* AI Generator Button */}
            <button
              type="button"
              onClick={handleGenerateAiHomework}
              disabled={isAiLoading}
              className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              {isAiLoading ? 'Yapay Zeka Ödev Üretiyor...' : 'Gemini Yapay Zeka Ödev Taslağı Oluştur'}
            </button>

            <form onSubmit={handleCreateHomework} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ödev Başlığı</label>
                <input
                  type="text"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="Örn: Ders Kitabı Sayfa 50-52 Çözümü"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama & Detaylar</label>
                <textarea
                  rows={3}
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  placeholder="Ödev detayları..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Son Teslim Tarihi</label>
                <input
                  type="date"
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHWOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
                >
                  Ödevi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
