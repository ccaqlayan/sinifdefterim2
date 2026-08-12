import React, { useState } from 'react';
import { Student, NotebookControl, ClassRoom, NotebookStatus } from '../types';
import { BookMarked, Check, Sliders, AlertTriangle, Save, Sparkles } from 'lucide-react';

interface NotebookViewProps {
  currentClass: ClassRoom;
  students: Student[];
  notebookControls: NotebookControl[];
  onSaveNotebookControl: (control: Omit<NotebookControl, 'id'>) => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  currentClass,
  students,
  notebookControls,
  onSaveNotebookControl,
}) => {
  const classStudents = students.filter((s) => s.classId === currentClass.id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Temporary state for sliders and notes
  const [localValues, setLocalValues] = useState<{
    [studentId: string]: { percentage: number; status: NotebookStatus; note: string };
  }>({});

  const getLatestControl = (studentId: string) => {
    const studentControls = notebookControls.filter((n) => n.studentId === studentId);
    return studentControls.length > 0 ? studentControls[studentControls.length - 1] : null;
  };

  const getStudentValue = (studentId: string) => {
    if (localValues[studentId]) return localValues[studentId];
    const latest = getLatestControl(studentId);
    if (latest) {
      return { percentage: latest.percentage, status: latest.status, note: latest.note || '' };
    }
    return { percentage: 100, status: 'full' as NotebookStatus, note: '' };
  };

  const updateStudentValue = (
    studentId: string,
    updates: Partial<{ percentage: number; status: NotebookStatus; note: string }>
  ) => {
    const current = getStudentValue(studentId);
    const updated = { ...current, ...updates };

    // Auto update status if percentage changes
    if (updates.percentage !== undefined && updates.status === undefined) {
      if (updated.percentage >= 85) updated.status = 'full';
      else if (updated.percentage >= 40) updated.status = 'partial';
      else updated.status = 'missing';
    }

    setLocalValues({ ...localValues, [studentId]: updated });
  };

  const handleApplyPreset = (studentId: string, status: NotebookStatus) => {
    let percentage = 100;
    if (status === 'partial') percentage = 60;
    if (status === 'missing') percentage = 0;
    updateStudentValue(studentId, { status, percentage });
  };

  const handleSaveAll = () => {
    classStudents.forEach((std) => {
      const val = getStudentValue(std.id);
      onSaveNotebookControl({
        studentId: std.id,
        classId: currentClass.id,
        date: date,
        status: val.status,
        percentage: val.percentage,
        note: val.note.trim() || undefined,
      });
    });
    alert('Defter kontrol verileri başarıyla kaydedildi!');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Banner Control Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Defter Kontrol Modülü</h3>
              <p className="text-xs text-slate-500">Sürgü ile yüzdesel tamlık kaydı yapın</p>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Tümünü Kaydet
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700">Kontrol Tarihi:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          />
        </div>
      </div>

      {/* Student List with Percentage Sliders */}
      <div className="space-y-3">
        {classStudents.map((student) => {
          const val = getStudentValue(student.id);

          return (
            <div
              key={student.id}
              className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      student.photoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        student.name + ' ' + student.surname
                      )}&background=6366f1&color=fff`
                    }
                    alt={student.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      #{student.number} {student.name} {student.surname}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        val.status === 'full'
                          ? 'bg-emerald-100 text-emerald-800'
                          : val.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {val.status === 'full' ? 'Defter Tam (%' + val.percentage + ')' : val.status === 'partial' ? 'Eksik Var (%' + val.percentage + ')' : 'Defter Yok (%' + val.percentage + ')'}
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleApplyPreset(student.id, 'full')}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      val.status === 'full'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tam (%100)
                  </button>
                  <button
                    onClick={() => handleApplyPreset(student.id, 'partial')}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      val.status === 'partial'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Yarım (%60)
                  </button>
                  <button
                    onClick={() => handleApplyPreset(student.id, 'missing')}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      val.status === 'missing'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Yok (%0)
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">Defter Tamlık Yüzdesi:</span>
                  <span className="text-indigo-600">%{val.percentage}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={val.percentage}
                  onChange={(e) => updateStudentValue(student.id, { percentage: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
              </div>

              {/* Note Input */}
              <input
                type="text"
                placeholder="Örn: Son ünite özet yazısı eksik, çizimler tam..."
                value={val.note}
                onChange={(e) => updateStudentValue(student.id, { note: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
