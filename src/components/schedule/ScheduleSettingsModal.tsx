import React, { useState, useEffect } from 'react';
import { ScheduleConfig, ScheduleDay, PeriodTime } from '../../types';
import { ALL_DAYS, DAY_FULL_NAMES, generatePeriodTimes } from '../../utils/scheduleUtils';
import { X, Check, Clock, Calendar, RefreshCw, Sliders, AlertCircle, Sparkles, Layout } from 'lucide-react';

interface ScheduleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScheduleConfig;
  onSaveConfig: (updatedConfig: ScheduleConfig) => void;
}

export const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [defaultView, setDefaultView] = useState<'daily' | 'grid' | 'list'>(config.defaultView || 'daily');
  const [periodsPerDay, setPeriodsPerDay] = useState<number>(config.periodsPerDay || 10);
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState<number>(config.lessonDurationMinutes || 40);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(config.breakDurationMinutes || 10);
  const [firstLessonStartTime, setFirstLessonStartTime] = useState<string>(config.firstLessonStartTime || '09:00');
  const [activeDays, setActiveDays] = useState<ScheduleDay[]>(config.activeDays || ['Pzt', 'Sal', 'Çar', 'Per', 'Cum']);
  const [lunchBreakAfterPeriod, setLunchBreakAfterPeriod] = useState<number>(config.lunchBreakAfterPeriod || 4);
  const [lunchBreakMinutes, setLunchBreakMinutes] = useState<number>(config.lunchBreakMinutes || 40);

  // Local list of period start-end times
  const [periodTimes, setPeriodTimes] = useState<PeriodTime[]>(config.periodTimes || []);

  useEffect(() => {
    if (isOpen) {
      setDefaultView(config.defaultView || 'daily');
      setPeriodsPerDay(config.periodsPerDay || 10);
      setLessonDurationMinutes(config.lessonDurationMinutes || 40);
      setBreakDurationMinutes(config.breakDurationMinutes || 10);
      setFirstLessonStartTime(config.firstLessonStartTime || '09:00');
      setActiveDays(config.activeDays || ['Pzt', 'Sal', 'Çar', 'Per', 'Cum']);
      setLunchBreakAfterPeriod(config.lunchBreakAfterPeriod || 4);
      setLunchBreakMinutes(config.lunchBreakMinutes || 40);
      setPeriodTimes(config.periodTimes || []);
    }
  }, [isOpen, config]);

  // Recalculate period times automatically based on durations
  const handleAutoRecalculate = () => {
    const calculated = generatePeriodTimes(
      periodsPerDay,
      firstLessonStartTime,
      lessonDurationMinutes,
      breakDurationMinutes,
      lunchBreakAfterPeriod,
      lunchBreakMinutes
    );
    setPeriodTimes(calculated);
  };

  // When periods count changes, adjust period times array
  const handlePeriodsCountChange = (newCount: number) => {
    setPeriodsPerDay(newCount);
    const calculated = generatePeriodTimes(
      newCount,
      firstLessonStartTime,
      lessonDurationMinutes,
      breakDurationMinutes,
      lunchBreakAfterPeriod,
      lunchBreakMinutes
    );
    setPeriodTimes(calculated);
  };

  const handlePeriodTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...periodTimes];
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      setPeriodTimes(updated);
    }
  };

  const handleToggleDay = (day: ScheduleDay) => {
    if (activeDays.includes(day)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== day));
      }
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: ScheduleConfig = {
      defaultView,
      periodsPerDay,
      lessonDurationMinutes,
      breakDurationMinutes,
      firstLessonStartTime,
      activeDays,
      lunchBreakAfterPeriod,
      lunchBreakMinutes,
      periodTimes: periodTimes.length === periodsPerDay 
        ? periodTimes 
        : generatePeriodTimes(periodsPerDay, firstLessonStartTime, lessonDurationMinutes, breakDurationMinutes, lunchBreakAfterPeriod, lunchBreakMinutes),
    };

    onSaveConfig(updatedConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="schedule-settings-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="schedule-settings-modal-card"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]"
      >
        {/* Header */}
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
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Süreler & Çizelge Ayarları
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Ders saatlerini, teneffüsleri ve aktif günleri yapılandırın
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            KAYDET
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* Varsayılan Açılış Sekmesi */}
          <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200/80 space-y-1.5">
            <label className="text-xs font-black text-indigo-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-600" />
                Sayfa Açılış Sekmesi
              </span>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Varsayılan Görünüm</span>
            </label>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value as 'daily' | 'grid' | 'list')}
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="daily">O Günün Akışı (Günlük Liste)</option>
              <option value="grid">Haftalık Program (Tablo)</option>
              <option value="list">Tüm Liste</option>
            </select>
          </div>

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Gün Başına Ders */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>Gün Başına Ders</span>
                <span className="text-blue-600 font-bold">{periodsPerDay} Ders</span>
              </label>
              <select
                value={periodsPerDay}
                onChange={(e) => handlePeriodsCountChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                  <option key={num} value={num}>
                    {num} Ders {num === 10 ? '(Varsayılan)' : num === 15 ? '(Maksimum 15 Ders)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* İlk Ders Başlangıç Saati */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>1. Ders Başlangıcı</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="time"
                value={firstLessonStartTime}
                onChange={(e) => {
                  setFirstLessonStartTime(e.target.value);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>

            {/* Ders Süresi */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>Ders Süresi</span>
                <span className="text-indigo-600 font-bold">{lessonDurationMinutes} dk</span>
              </label>
              <select
                value={lessonDurationMinutes}
                onChange={(e) => setLessonDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {[30, 35, 40, 45, 50, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} Dakika {m === 40 ? '(MEB Standartı)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Teneffüs Süresi */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>Teneffüs Süresi</span>
                <span className="text-indigo-600 font-bold">{breakDurationMinutes} dk</span>
              </label>
              <select
                value={breakDurationMinutes}
                onChange={(e) => setBreakDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 15, 20].map((m) => (
                  <option key={m} value={m}>
                    {m} Dakika {m === 10 ? '(Standart 10 dk)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Öğle Arası Ayarları */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Öğle Arası Molası (Opsiyonel)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-amber-800 block mb-1">Kaçıncı Dersten Sonra?</label>
                <select
                  value={lunchBreakAfterPeriod}
                  onChange={(e) => setLunchBreakAfterPeriod(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value={0}>Öğle Arası Yok</option>
                  {Array.from({ length: periodsPerDay - 1 }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      {p}. Dersten Sonra {p === 4 ? '(Standart 4. Ders)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-800 block mb-1">Öğle Arası Süresi</label>
                <select
                  value={lunchBreakMinutes}
                  onChange={(e) => setLunchBreakMinutes(parseInt(e.target.value, 10))}
                  disabled={lunchBreakAfterPeriod === 0}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {[30, 40, 45, 50, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} Dakika {m === 40 ? '(40 dk)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Aktif Günler Seçici */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Programda Gösterilecek Günler
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum'])}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  Hafta İçi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDays(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'])}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  6 Gün
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDays(ALL_DAYS)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  Tüm Hafta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {ALL_DAYS.map((d) => {
                const isSelected = activeDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleDay(d)}
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

          {/* Ders Başlangıç Zamanları Listesi (Matching Screenshot 3) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Ders Başlangıç Zamanları
              </label>
              <button
                type="button"
                onClick={handleAutoRecalculate}
                className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer"
                title="Süreleri ayarlara göre baştan hesapla"
              >
                <RefreshCw className="w-3 h-3" />
                Otomatik Hesapla
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {periodTimes.map((pt, idx) => (
                <div
                  key={pt.period}
                  className="p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-2 transition-all"
                >
                  <span className="text-xs font-black text-slate-700 min-w-[70px]">
                    {pt.period}. Ders
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold">Başlangıç:</span>
                      <input
                        type="time"
                        value={pt.startTime}
                        onChange={(e) => handlePeriodTimeChange(idx, 'startTime', e.target.value)}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center w-20"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold">Bitiş:</span>
                      <input
                        type="time"
                        value={pt.endTime}
                        onChange={(e) => handlePeriodTimeChange(idx, 'endTime', e.target.value)}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center w-20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
