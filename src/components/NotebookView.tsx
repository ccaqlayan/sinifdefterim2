import React, { useState } from 'react';
import { 
  Student, NotebookControl, ClassRoom, NotebookStatus, 
  PerformanceLog, QuizScore, Homework, HomeworkRecord, WeightSettings 
} from '../types';
import { StudentDetailModal } from './StudentDetailModal';
import { 
  BookMarked, Save, Sparkles, UserX, CheckCircle2, RotateCcw, 
  CheckCheck, Info, UserCheck, Calendar, Sliders, ExternalLink,
  CheckCircle, AlertCircle, X
} from 'lucide-react';

interface NotebookViewProps {
  currentClass: ClassRoom;
  students: Student[];
  notebookControls: NotebookControl[];
  onSaveNotebookControl: (control: Omit<NotebookControl, 'id'>) => void;
  plusMinusLogs?: PerformanceLog[];
  quizzes?: QuizScore[];
  homeworks?: Homework[];
  homeworkRecords?: HomeworkRecord[];
  weights?: WeightSettings;
}

interface StudentNotebookState {
  isAbsent: boolean; // Gelmedi / Veri girilmedi (G butonu aktif)
  percentage: number;
  status: NotebookStatus;
  note: string;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  currentClass,
  students,
  notebookControls,
  onSaveNotebookControl,
  plusMinusLogs = [],
  quizzes = [],
  homeworks = [],
  homeworkRecords = [],
  weights = { quizWeight: 40, plusMinusWeight: 30, homeworkWeight: 20, notebookWeight: 10 },
}) => {
  const classStudents = students.filter((s) => s.classId === currentClass.id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Local values: by default all students start with isAbsent = true ("G" gelmedi / boş)
  const [localValues, setLocalValues] = useState<{
    [studentId: string]: StudentNotebookState;
  }>({});

  // Selected student for viewing full history / report card
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // In-app visual notification banner & feedback state
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'warning';
    title: string;
    message: string;
    savedCount: number;
    absentCount: number;
  } | null>(null);

  const getStudentValue = (studentId: string): StudentNotebookState => {
    if (localValues[studentId]) {
      return localValues[studentId];
    }
    // Default: Boş / Gelmedi (G aktif)
    return {
      isAbsent: true,
      percentage: 100,
      status: 'full',
      note: '',
    };
  };

  const updateStudentValue = (
    studentId: string,
    updates: Partial<StudentNotebookState>
  ) => {
    const current = getStudentValue(studentId);
    const updated: StudentNotebookState = { ...current, ...updates };

    // If slider or percentage changed without specifying status, compute status
    if (updates.percentage !== undefined && updates.status === undefined) {
      if (updated.percentage >= 85) updated.status = 'full';
      else if (updated.percentage >= 40) updated.status = 'partial';
      else updated.status = 'missing';
    }

    setLocalValues((prev) => ({
      ...prev,
      [studentId]: updated,
    }));
  };

  // Toggle G (Gelmedi / Boş) state
  const handleToggleAbsent = (studentId: string) => {
    const current = getStudentValue(studentId);
    if (current.isAbsent) {
      // Switch from G to Evaluated (default to Tam %100)
      updateStudentValue(studentId, {
        isAbsent: false,
        status: 'full',
        percentage: 100,
      });
    } else {
      // Switch to G (Gelmedi)
      updateStudentValue(studentId, {
        isAbsent: true,
      });
    }
  };

  const handleApplyPreset = (studentId: string, status: NotebookStatus) => {
    let percentage = 100;
    if (status === 'partial') percentage = 60;
    if (status === 'missing') percentage = 0;

    updateStudentValue(studentId, {
      isAbsent: false,
      status,
      percentage,
    });
  };

  const handleSetAllAbsent = () => {
    const newValues: { [id: string]: StudentNotebookState } = {};
    classStudents.forEach((std) => {
      newValues[std.id] = {
        isAbsent: true,
        percentage: 100,
        status: 'full',
        note: '',
      };
    });
    setLocalValues(newValues);
  };

  const handleSetAllFull = () => {
    const newValues: { [id: string]: StudentNotebookState } = {};
    classStudents.forEach((std) => {
      const current = getStudentValue(std.id);
      newValues[std.id] = {
        ...current,
        isAbsent: false,
        status: 'full',
        percentage: 100,
      };
    });
    setLocalValues(newValues);
  };

  const handleSaveAll = () => {
    const evaluatedStudents = classStudents.filter((std) => !getStudentValue(std.id).isAbsent);
    const absentCount = classStudents.length - evaluatedStudents.length;

    if (evaluatedStudents.length === 0) {
      setSaveFeedback({
        type: 'warning',
        title: 'Veri Girişi Bulunamadı',
        message: 'Hiçbir öğrenci için defter verisi belirlenmedi. Kayıt yapmak için lütfen en az bir öğrencinin defter durumunu seçin veya "Tümünü Tam Yap" butonunu kullanın.',
        savedCount: 0,
        absentCount: classStudents.length,
      });
      return;
    }

    evaluatedStudents.forEach((std) => {
      const val = getStudentValue(std.id);
      const payload: Omit<NotebookControl, 'id'> = {
        studentId: std.id,
        classId: currentClass.id,
        date: date,
        status: val.status,
        percentage: val.percentage,
      };
      if (val.note.trim()) {
        payload.note = val.note.trim();
      }
      onSaveNotebookControl(payload);
    });

    setSaveFeedback({
      type: 'success',
      title: 'Defter Kontrolleri Başarıyla Kaydedildi',
      message: absentCount > 0
        ? `${evaluatedStudents.length} öğrencinin defter kontrolü sisteme kaydedildi. (${absentCount} gelmeyen / kontrol edilmeyen öğrenci atlandı.)`
        : `Tüm sınıfın (${evaluatedStudents.length} öğrenci) defter kontrol verisi başarıyla sisteme işlendi.`,
      savedCount: evaluatedStudents.length,
      absentCount: absentCount,
    });
  };

  const evaluatedCount = classStudents.filter((s) => !getStudentValue(s.id).isAbsent).length;
  const absentCount = classStudents.length - evaluatedCount;

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Banner Control Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">Defter Kontrol Modülü</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {currentClass.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sayfa <strong className="text-amber-700">"G" (Gelmedi)</strong> ile başlar. Değişiklik yaptığınızda veriye dönüşür.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> Tümünü Kaydet ({evaluatedCount})
            </button>
          </div>
        </div>

        {/* Date & Bulk Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Kontrol Tarihi:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
            />
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSetAllAbsent}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Tüm öğrencileri gelmedi (G) olarak işaretle"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Tümünü G Yap
            </button>
            <button
              type="button"
              onClick={handleSetAllFull}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Tüm öğrencileri Tam (%100) olarak işaretle"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Tümünü Tam Yap (%100)
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 block">Sınıf Mevcudu</span>
            <span className="text-xs font-black text-slate-900">{classStudents.length} Öğrenci</span>
          </div>
          <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/60">
            <span className="text-[10px] font-bold text-amber-700 block">Gelmeyen / Boş (G)</span>
            <span className="text-xs font-black text-amber-900">{absentCount} Öğrenci</span>
          </div>
          <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-700 block">Kaydedilecek Veri</span>
            <span className="text-xs font-black text-emerald-900">{evaluatedCount} Öğrenci</span>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Bu sınıfta henüz kayıtlı öğrenci bulunmuyor.
          </div>
        ) : (
          classStudents.map((student) => {
            const val = getStudentValue(student.id);

            return (
              <div
                key={student.id}
                className={`bg-white border rounded-2xl p-3.5 shadow-2xs space-y-3 transition-all ${
                  val.isAbsent
                    ? 'border-slate-200 opacity-90 hover:opacity-100 hover:border-amber-300'
                    : 'border-amber-200/80 ring-1 ring-amber-100/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Student Info - Clickable to open past history modal */}
                  <div
                    onClick={() => setSelectedStudentForModal(student)}
                    className="flex items-center gap-3 cursor-pointer group select-none flex-1 min-w-0"
                    title="Öğrencinin geçmiş karne ve defter verilerini görmek için tıklayın"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          student.photoUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            student.name + ' ' + student.surname
                          )}&background=6366f1&color=fff`
                        }
                        alt={student.name}
                        className="w-11 h-11 rounded-2xl object-cover border-2 border-slate-200 group-hover:border-amber-500 transition-all shrink-0 shadow-2xs"
                      />
                      {val.isAbsent ? (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-slate-800 text-white font-black text-[10px] flex items-center justify-center border border-white">
                          G
                        </span>
                      ) : (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center border border-white">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{student.number}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors truncate flex items-center gap-1">
                          {student.name} {student.surname}
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 opacity-60 group-hover:opacity-100 shrink-0" />
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {val.isAbsent ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Gelmeyen / Değerlendirilmedi (G)
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              val.status === 'full'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : val.status === 'partial'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {val.status === 'full'
                              ? `Defter Tam (%${val.percentage})`
                              : val.status === 'partial'
                              ? `Eksik Var (%${val.percentage})`
                              : `Defter Yok (%${val.percentage})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: G Butonu & Presets */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* G (Gelmedi) Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAbsent(student.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        val.isAbsent
                          ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={val.isAbsent ? 'Öğrenci Gelmedi / Veri Girilmedi (Aktif)' : 'Gelmedi (G) Olarak İşaretle'}
                    >
                      <span className="font-black text-amber-400">G</span>
                      <span className="text-[11px]">{val.isAbsent ? 'Gelmedi' : 'G'}</span>
                    </button>

                    {/* Presets (Clicking any preset automatically turns off G) */}
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(student.id, 'full')}
                      className={`px-2.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        !val.isAbsent && val.status === 'full' && val.percentage === 100
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                      title="Defter Tam (%100)"
                    >
                      Tam (%100)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(student.id, 'partial')}
                      className={`px-2.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        !val.isAbsent && val.status === 'partial' && val.percentage === 60
                          ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                      }`}
                      title="Kısmen Eksik (%60)"
                    >
                      Yarım (%60)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(student.id, 'missing')}
                      className={`px-2.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        !val.isAbsent && val.status === 'missing' && val.percentage === 0
                          ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                      }`}
                      title="Defter Yok (%0)"
                    >
                      Yok (%0)
                    </button>
                  </div>
                </div>

                {/* Percentage Slider & Live Bar */}
                <div className={`space-y-1.5 pt-1 transition-opacity ${val.isAbsent ? 'opacity-40' : 'opacity-100'}`}>
                  <div className="flex justify-between items-center text-[11px] font-black">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-amber-600" /> Hassas Defter Tamlık Yüzdesi:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-black ${
                        val.isAbsent
                          ? 'text-slate-500 bg-slate-100'
                          : val.percentage >= 80
                          ? 'text-emerald-700 bg-emerald-50'
                          : val.percentage >= 40
                          ? 'text-amber-700 bg-amber-50'
                          : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {val.isAbsent ? 'Giriş Bekleniyor (G)' : `%${val.percentage}`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={val.percentage}
                    onChange={(e) => {
                      updateStudentValue(student.id, {
                        isAbsent: false,
                        percentage: Number(e.target.value),
                      });
                    }}
                    className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* Note Input */}
                <input
                  type="text"
                  placeholder="İsteğe bağlı defter notu (örn: Son ünite özet yazısı eksik, çizimler tam...)"
                  value={val.note}
                  onChange={(e) => {
                    updateStudentValue(student.id, {
                      isAbsent: false,
                      note: e.target.value,
                    });
                  }}
                  className={`w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium ${
                    val.isAbsent ? 'opacity-60' : 'opacity-100'
                  }`}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Student Past History / Details Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
        currentClass={currentClass}
        plusMinusLogs={plusMinusLogs}
        quizzes={quizzes}
        homeworks={homeworks}
        homeworkRecords={homeworkRecords}
        notebookControls={notebookControls}
        weights={weights}
        initialTab="notebook"
      />

      {/* In-App Save Feedback Modal / Toast Notification */}
      {saveFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${
                    saveFeedback.type === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {saveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{saveFeedback.title}</h4>
                  <p className="text-[11px] text-slate-500 font-bold">{currentClass.name} • {date}</p>
                </div>
              </div>
              <button
                onClick={() => setSaveFeedback(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
              {saveFeedback.message}
            </p>

            {saveFeedback.type === 'success' && (
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 block">Kaydedilen</span>
                  <span className="text-sm font-black text-emerald-900">{saveFeedback.savedCount} Öğrenci</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Gelmeyen (G)</span>
                  <span className="text-sm font-black text-slate-700">{saveFeedback.absentCount} Öğrenci</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSaveFeedback(null)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer text-white ${
                saveFeedback.type === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Floating Fixed Save Button for Notebook */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={handleSaveAll}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-xl shadow-amber-600/30 border-2 border-amber-400/30 font-bold flex items-center gap-2.5 p-3.5 sm:px-5 sm:py-3.5 rounded-full sm:rounded-2xl transition-all cursor-pointer active:scale-95 hover:scale-105 group"
          title="Defter Kontrollerini Kaydet"
        >
          <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-extrabold text-xs">Defteri Kaydet</span>
        </button>
      </div>
    </div>
  );
};
