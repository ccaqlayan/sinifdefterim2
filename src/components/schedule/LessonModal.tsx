import React, { useState, useEffect } from 'react';
import { ScheduleConfig, ScheduleDay, ScheduleLesson, ClassRoom } from '../../types';
import { ALL_DAYS, DAY_FULL_NAMES, COLOR_PALETTE } from '../../utils/scheduleUtils';
import { ScheduleConfirmModal } from './ScheduleConfirmModal';
import { X, Check, Trash2, Plus, Sparkles, AlertCircle, Copy } from 'lucide-react';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lessonData: Omit<ScheduleLesson, 'id'>, isBatchMode: boolean) => void;
  onDelete?: (lessonId: string) => void;
  editingLesson?: ScheduleLesson | null;
  config: ScheduleConfig;
  classes: ClassRoom[];
  initialDay?: ScheduleDay;
  initialPeriod?: number;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingLesson,
  config,
  classes,
  initialDay,
  initialPeriod,
}) => {
  const [title, setTitle] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#EF4444');
  const [selectedDays, setSelectedDays] = useState<ScheduleDay[]>(['Pzt']);
  const [period, setPeriod] = useState<number>(1);
  const [customStartTime, setCustomStartTime] = useState<string>('09:00');
  const [customEndTime, setCustomEndTime] = useState<string>('09:40');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [classId, setClassId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  const isEditing = !!editingLesson;

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (editingLesson) {
      setTitle(editingLesson.title || '');
      setShortName(editingLesson.shortName || '');
      setColor(editingLesson.color || '#EF4444');
      setSelectedDays([editingLesson.day]);
      setPeriod(editingLesson.period || 1);
      setClassId(editingLesson.classId || '');
      setNote(editingLesson.note || '');

      const pTime = config.periodTimes.find((p) => p.period === editingLesson.period);
      setCustomStartTime(editingLesson.startTime || pTime?.startTime || '09:00');
      setCustomEndTime(editingLesson.endTime || pTime?.endTime || '09:40');
    } else {
      const defaultDay = initialDay || (config.activeDays[0] || 'Pzt');
      const defaultPeriod = initialPeriod || 1;

      setTitle('');
      setShortName('');
      setColor(COLOR_PALETTE[Math.floor(Math.random() * 5)].value);
      setSelectedDays([defaultDay]);
      setPeriod(defaultPeriod);
      setClassId('');
      setNote('');

      const pTime = config.periodTimes.find((p) => p.period === defaultPeriod);
      setCustomStartTime(pTime?.startTime || '09:00');
      setCustomEndTime(pTime?.endTime || '09:40');
    }
  }, [isOpen, editingLesson, initialDay, initialPeriod, config]);

  // Sync times when period changes
  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
    const pTime = config.periodTimes.find((p) => p.period === newPeriod);
    if (pTime) {
      setCustomStartTime(pTime.startTime);
      setCustomEndTime(pTime.endTime);
    }
  };

  // Quick class selector handler
  const handleSelectClass = (cls: ClassRoom) => {
    setClassId(cls.id);
    const generatedTitle = `${cls.name} ${cls.subject}`;
    setTitle(generatedTitle);
    
    // Auto-generate concise short name (e.g. "9-A" -> "9A", "10-B" -> "10B")
    const cleanShort = cls.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setShortName(cleanShort);
  };

  const toggleDaySelection = (day: ScheduleDay) => {
    if (isEditing) {
      setSelectedDays([day]); // single day when editing
    } else {
      if (selectedDays.includes(day)) {
        if (selectedDays.length > 1) {
          setSelectedDays(selectedDays.filter((d) => d !== day));
        }
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanTitle = title.trim() || 'Ders';
    const cleanShort = shortName.trim() || cleanTitle.slice(0, 5).toUpperCase();

    // Save for each selected day
    selectedDays.forEach((day) => {
      onSave(
        {
          title: cleanTitle,
          shortName: cleanShort,
          color,
          day,
          period,
          startTime: customStartTime,
          endTime: customEndTime,
          classId: classId || undefined,
          note: note.trim() || undefined,
        },
        isBatchMode
      );
    });

    if (isBatchMode && !isEditing) {
      // In batch mode: keep modal open and advance period for quick consecutive entry
      if (period < config.periodsPerDay) {
        handlePeriodChange(period + 1);
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="lesson-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="lesson-modal-card"
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                {isEditing ? 'Dersi Düzenle' : 'Yeni Ders'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {isEditing ? 'Ders bilgilerini güncelleyin' : 'Programınıza yeni bir ders ekleyin'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={!title.trim() && !shortName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            KAYDET
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Quick Select from existing classes */}
          {classes.length > 0 && !isEditing && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Kayıtlı Sınıflardan Hızlı Seç:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleSelectClass(cls)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      classId === cls.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cls.name} ({cls.subject})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* İsim Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>İsim <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal">Örn: 10-C veya Matematik</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!shortName) {
                  setShortName(e.target.value.slice(0, 6).toUpperCase());
                }
              }}
              placeholder="Örn: 10-C Matematik"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Kısaltma Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>Kısaltma <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal">Tabloda görünecek kısa kod</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                maxLength={10}
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Örn: 10C, 12D, 10C REH"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white tracking-wide uppercase transition-all"
              />
              {/* Preview Badge */}
              <div
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center min-w-[70px] text-center"
                style={{ backgroundColor: color, color: '#FFFFFF' }}
              >
                {shortName || 'ÖNİZLEME'}
              </div>
            </div>
          </div>

          {/* Renk Seçimi (Color Palette & Spectrum) */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block">
              Renk Seçimi
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-9 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
                    color === c.value
                      ? 'ring-3 ring-offset-2 ring-slate-900 scale-105 shadow-md'
                      : 'hover:scale-102 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && (
                    <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Günleri Seç (Day Selector) */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>Günleri Seç</span>
              {!isEditing && (
                <span className="text-[10px] text-indigo-600 font-bold">
                  {selectedDays.length > 1 ? `${selectedDays.length} Gün Seçildi` : 'Çoklu gün seçebilirsiniz'}
                </span>
              )}
            </label>
            <div className="grid grid-cols-7 gap-1">
              {ALL_DAYS.map((d) => {
                const isSelected = selectedDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDaySelection(d)}
                    className={`py-2 rounded-xl text-xs font-black transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ders & Saat Seçimi */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800">
                Ders Saati Seçimi
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {DAY_FULL_NAMES[selectedDays[0]]} günü
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Ders No</label>
                <select
                  value={period}
                  onChange={(e) => handlePeriodChange(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: config.periodsPerDay }, (_, i) => i + 1).map((p) => {
                    const pTime = config.periodTimes.find((pt) => pt.period === p);
                    return (
                      <option key={p} value={p}>
                        {p}. Ders {pTime ? `(${pTime.startTime})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Başlangıç</label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Bitiş</label>
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>
            </div>
          </div>

          {/* Toplu Ekleme Modu (Batch Mode Switch) */}
          {!isEditing && (
            <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 flex items-start gap-3">
              <input
                type="checkbox"
                id="batch-mode-toggle"
                checked={isBatchMode}
                onChange={(e) => setIsBatchMode(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="batch-mode-toggle" className="text-xs text-blue-900 cursor-pointer select-none">
                <span className="font-extrabold block">Toplu Ekleme Modu (Batch mode)</span>
                <span className="text-[11px] text-blue-700/90 leading-relaxed block mt-0.5">
                  Açık olduğunda 'Kaydet' butonuna basmak bu pencereyi kapatmaz; ardışık dersleri hızlıca eklemenizi sağlar.
                </span>
              </label>
            </div>
          )}

          {/* Delete button when editing */}
          {isEditing && onDelete && editingLesson && (
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Bu Dersi Programdan Sil
            </button>
          )}
        </form>
      </div>

      {/* Confirmation Modal */}
      {isEditing && onDelete && editingLesson && (
        <ScheduleConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => {
            setIsDeleteConfirmOpen(false);
            onDelete(editingLesson.id);
            onClose();
          }}
          title="Dersi Programdan Kaldır"
          description="Bu dersi haftalık ders programınızdan silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Evet, Dersi Sil"
          cancelText="Vazgeç"
          type="danger"
          lessonPreview={{
            shortName: shortName || editingLesson.shortName,
            title: title || editingLesson.title,
            color: color || editingLesson.color,
            day: DAY_FULL_NAMES[selectedDays[0] || editingLesson.day],
            period: period || editingLesson.period,
          }}
        />
      )}
    </div>
  );
};
