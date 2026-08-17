import React, { useState, useEffect } from 'react';
import { ScheduleConfig, ScheduleDay, ScheduleLesson, ClassRoom } from '../../types';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';
import { CurrentLessonWidget } from './CurrentLessonWidget';
import { LessonModal } from './LessonModal';
import { ScheduleSettingsModal } from './ScheduleSettingsModal';
import { ScheduleConfirmModal } from './ScheduleConfirmModal';
import { ALL_DAYS, DAY_FULL_NAMES, INITIAL_SCHEDULE_LESSONS, getTodayScheduleDay } from '../../utils/scheduleUtils';
import { useCurrentLessonTracker } from '../../utils/currentLessonTracker';
import { 
  Calendar, 
  Plus, 
  Sliders, 
  Clock, 
  RotateCcw, 
  Printer, 
  Download, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Layers, 
  List, 
  Grid,
  AlertCircle,
  Edit3
} from 'lucide-react';

interface ScheduleViewProps {
  config: ScheduleConfig;
  lessons: ScheduleLesson[];
  classes: ClassRoom[];
  onSaveLesson: (lessonData: Omit<ScheduleLesson, 'id'>, isBatchMode: boolean) => void;
  onUpdateLesson: (lesson: ScheduleLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onClearAllLessons: () => void;
  onLoadInitialTemplate: () => void;
  onSaveConfig: (config: ScheduleConfig) => void;
  onSelectClass?: (classId: string) => void;
  onBackToDashboard?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  config,
  lessons,
  classes,
  onSaveLesson,
  onUpdateLesson,
  onDeleteLesson,
  onClearAllLessons,
  onLoadInitialTemplate,
  onSaveConfig,
  onSelectClass,
  onBackToDashboard,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'daily' | 'list'>(config.defaultView || 'daily');
  const [selectedDay, setSelectedDay] = useState<ScheduleDay>(getTodayScheduleDay());

  useEffect(() => {
    if (config.defaultView) {
      setViewMode(config.defaultView);
    }
  }, [config.defaultView]);

  // Modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<ScheduleLesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<ScheduleLesson | null>(null);
  const [initialSlot, setInitialSlot] = useState<{ day: ScheduleDay; period: number } | null>(null);

  const { status } = useCurrentLessonTracker(config, lessons, classes);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open modal to add lesson at specific slot
  const handleAddLessonAtSlot = (day: ScheduleDay, period: number) => {
    setEditingLesson(null);
    setInitialSlot({ day, period });
    setIsLessonModalOpen(true);
  };

  // Open modal from global "+" button
  const handleAddNewLessonGlobal = () => {
    setEditingLesson(null);
    setInitialSlot({ day: selectedDay, period: 1 });
    setIsLessonModalOpen(true);
  };

  // Edit existing lesson
  const handleEditLesson = (lesson: ScheduleLesson) => {
    setEditingLesson(lesson);
    setInitialSlot({ day: lesson.day, period: lesson.period });
    setIsLessonModalOpen(true);
  };

  // Duplicate lesson to next period
  const handleDuplicateLesson = (lesson: ScheduleLesson) => {
    const nextPeriod = lesson.period < config.periodsPerDay ? lesson.period + 1 : lesson.period;
    const pTime = config.periodTimes.find((p) => p.period === nextPeriod);

    onSaveLesson(
      {
        title: lesson.title,
        shortName: lesson.shortName,
        color: lesson.color,
        day: lesson.day,
        period: nextPeriod,
        startTime: pTime?.startTime || lesson.startTime,
        endTime: pTime?.endTime || lesson.endTime,
        classId: lesson.classId,
        note: lesson.note,
      },
      false
    );
    showToast(`Ders ${DAY_FULL_NAMES[lesson.day]} ${nextPeriod}. saate kopyalandı.`);
  };

  // Save handler from modal
  const handleModalSave = (lessonData: Omit<ScheduleLesson, 'id'>, isBatchMode: boolean) => {
    if (editingLesson) {
      onUpdateLesson({
        ...editingLesson,
        ...lessonData,
      });
      showToast('Ders başarıyla güncellendi.');
    } else {
      onSaveLesson(lessonData, isBatchMode);
      showToast('Ders programa eklendi.');
    }
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Calculate statistics
  const totalWeeklyHours = lessons.length;
  const uniqueClassNames = Array.from(new Set(lessons.map((l) => l.shortName || l.title)));
  const todayLessons = lessons.filter((l) => l.day === selectedDay).sort((a, b) => a.period - b.period);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Haftalık Çizelge
              </span>
              <span className="text-[11px] sm:text-xs text-indigo-300 font-semibold">
                Toplam: <b className="text-white">{totalWeeklyHours} Saat</b>
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              Haftalık Ders Programı
            </h1>
            <p className="text-xs text-indigo-200/90 font-medium max-w-xl mt-1 leading-relaxed hidden sm:block">
              Ders saatlerinizi, günlerinizi ve teneffüslerinizi düzenleyin. Tablodaki boş hücrelere tıklayarak ders ekleyebilirsiniz.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex-1 sm:flex-initial px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Süreler ve Saat Ayarları"
            >
              <Sliders className="w-4 h-4 text-amber-300" />
              <span>Ayarlar</span>
            </button>

            <button
              onClick={handleAddNewLessonGlobal}
              className="flex-1 sm:flex-initial px-3.5 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="whitespace-nowrap">Ders Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Current / Upcoming Lesson Banner Widget */}
      <CurrentLessonWidget
        config={config}
        lessons={lessons}
        classes={classes}
        onSelectClass={onSelectClass}
      />

      {/* Control Bar: View Switcher & Secondary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* View Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Günlük </span>Akış
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Haftalık </span>Tablo
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Liste</span>
          </button>
        </div>

        {/* Secondary Management Options */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
          {lessons.length === 0 ? (
            <button
              onClick={onLoadInitialTemplate}
              className="w-full sm:w-auto px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Örnek Programı Yükle
            </button>
          ) : (
            <>
              <button
                onClick={handlePrint}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Programı Yazdır"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Yazdır</span>
              </button>

              <button
                onClick={() => setIsClearAllConfirmOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Tüm Programı Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Areas */}
      {lessons.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-xs space-y-4 max-w-lg mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">Ders Programınız Henüz Boş</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Ders programı eklemek isteğe bağlıdır. Hazır örnek programı yükleyebilir veya derslerinizi tek tek eklemeye başlayabilirsiniz.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={onLoadInitialTemplate}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Örnek Programı Yükle
            </button>
            <button
              onClick={handleAddNewLessonGlobal}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Kendi Dersimi Ekle
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW 1: Haftalık Grid Tablosu (Screenshot 2) */}
          {viewMode === 'grid' && (
            <WeeklyScheduleGrid
              config={config}
              lessons={lessons}
              classes={classes}
              onAddLesson={handleAddLessonAtSlot}
              onEditLesson={handleEditLesson}
              onDeleteLesson={onDeleteLesson}
              onDuplicateLesson={handleDuplicateLesson}
              onSelectClass={onSelectClass}
            />
          )}

          {/* VIEW 2: Günlük Akış (Timeline view - Mobile friendly) */}
          {viewMode === 'daily' && (
            <div className="space-y-4">
              {/* Day Selector Pills */}
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                {config.activeDays.map((d) => {
                  const isSelected = selectedDay === d;
                  const dayLessonsCount = lessons.filter((l) => l.day === d).length;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`p-2.5 rounded-2xl text-center transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-900 text-white border-indigo-900 shadow-md'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-black">{d}</div>
                      <div className="text-[10px] opacity-75 font-semibold">
                        {dayLessonsCount > 0 ? `${dayLessonsCount} Ders` : 'Boş'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Day's Lessons List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    {DAY_FULL_NAMES[selectedDay]} Gününün Dersleri
                  </h3>
                  <button
                    onClick={() => handleAddLessonAtSlot(selectedDay, todayLessons.length + 1)}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Bu Güne Ekle
                  </button>
                </div>

                {todayLessons.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                    Bu gün için henüz ders tanımlanmamış.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayLessons.map((l) => {
                      const pTime = config.periodTimes.find((p) => p.period === l.period);
                      
                      const isOngoing = status.state === 'ONGOING' && status.currentLesson?.id === l.id;
                      const isNext = status.nextLesson?.id === l.id;
                      
                      return (
                        <div
                          key={l.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isOngoing
                              ? 'border-rose-300 bg-rose-50/50 shadow-md ring-2 ring-rose-500 scale-[1.01]'
                              : isNext
                              ? 'border-amber-300 bg-amber-50/50 shadow-sm ring-1 ring-amber-400'
                              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 text-center ${
                                isOngoing ? 'shadow-lg animate-pulse' : 'shadow-2xs'
                              }`}
                              style={{ backgroundColor: l.color }}
                            >
                              {l.shortName}
                            </div>
                            <div className="flex flex-col">
                              <h4 className="text-sm font-black text-slate-800 flex flex-wrap items-center gap-2">
                                <span>{l.title}</span>
                                {isOngoing && (
                                  <span className="hidden sm:flex text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    CANLI
                                  </span>
                                )}
                                {isNext && !isOngoing && (
                                  <span className="hidden sm:inline-block text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold">
                                    SIRADAKİ
                                  </span>
                                )}
                              </h4>
                              <p className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${isOngoing ? 'text-rose-600 font-bold' : isNext ? 'text-amber-700' : 'text-slate-500'}`}>
                                <Clock className={`w-3 h-3 ${isOngoing ? 'text-rose-500 animate-pulse' : isNext ? 'text-amber-600' : 'text-slate-400'}`} />
                                <span>{l.period}. Ders • {l.startTime || pTime?.startTime || ''} - {l.endTime || pTime?.endTime || ''}</span>
                                {isOngoing && status.formattedTimeRemaining && (
                                  <span className="hidden sm:inline-block ml-1 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md border border-rose-200">
                                    Bitimine: {status.formattedTimeRemaining}
                                  </span>
                                )}
                                {isNext && status.formattedTimeRemaining && (
                                  <span className="hidden sm:inline-block ml-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                                    Başlamasına: {status.formattedTimeRemaining}
                                  </span>
                                )}
                              </p>
                              
                              {/* Mobile Only: Badges on new line */}
                              {(isOngoing || isNext) && (
                                <div className="flex sm:hidden items-center flex-wrap gap-2 mt-1.5">
                                  {isOngoing && (
                                    <>
                                      <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                        CANLI
                                      </span>
                                      <span className="text-[10px] font-bold text-rose-700">
                                        Bitimine: {status.formattedTimeRemaining}
                                      </span>
                                    </>
                                  )}
                                  {isNext && !isOngoing && (
                                    <>
                                      <span className="text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold">
                                        SIRADAKİ
                                      </span>
                                      <span className="text-[10px] font-bold text-amber-700">
                                        Başlamasına: {status.formattedTimeRemaining}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditLesson(l)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setLessonToDelete(l)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: Tüm Liste Görünümü */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
              <h3 className="text-sm font-black text-slate-800">Tüm Kayıtlı Dersler ({lessons.length} Ders)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {lessons.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: l.color }}
                      >
                        {l.shortName}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-800 truncate">{l.title}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {DAY_FULL_NAMES[l.day]} • {l.period}. Ders
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditLesson(l)}
                        className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer shrink-0"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => setLessonToDelete(l)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0 transition-all"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lesson Add/Edit Modal (Screenshot 1) */}
      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onSave={handleModalSave}
        onDelete={onDeleteLesson}
        editingLesson={editingLesson}
        config={config}
        classes={classes}
        initialDay={initialSlot?.day}
        initialPeriod={initialSlot?.period}
      />

      {/* Schedule Settings Modal (Screenshot 3) */}
      <ScheduleSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSaveConfig={(updatedConfig) => {
          onSaveConfig(updatedConfig);
          showToast('Süreler ve çizelge ayarları kaydedildi.');
        }}
      />

      {/* Confirmation Modal for Clearing All Lessons (Double Confirmation & Hardened Security) */}
      <ScheduleConfirmModal
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={() => {
          setIsClearAllConfirmOpen(false);
          onClearAllLessons();
          showToast('Ders programı tamamen temizlendi.');
        }}
        title="Tüm Ders Programı Temizlensin mi?"
        description="Haftalık ders programınızdaki tüm kayıtlı dersler kalıcı olarak silinecektir. Bu işlem geri alınamaz."
        confirmText="Evet, Tümünü Temizle"
        cancelText="Vazgeç"
        type="danger"
        doubleConfirm={true}
        requiredWord="TEMİZLE"
        itemCount={lessons.length}
      />

      {/* Confirmation Modal for Single Lesson in ScheduleView */}
      {lessonToDelete && (
        <ScheduleConfirmModal
          isOpen={!!lessonToDelete}
          onClose={() => setLessonToDelete(null)}
          onConfirm={() => {
            if (lessonToDelete) {
              onDeleteLesson(lessonToDelete.id);
              showToast(`"${lessonToDelete.title}" dersi programdan kaldırıldı.`);
              setLessonToDelete(null);
            }
          }}
          title="Dersi Programdan Kaldır"
          description="Bu dersi haftalık ders programınızdan silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Evet, Dersi Sil"
          cancelText="Vazgeç"
          type="danger"
          lessonPreview={{
            shortName: lessonToDelete.shortName,
            title: lessonToDelete.title,
            color: lessonToDelete.color,
            day: DAY_FULL_NAMES[lessonToDelete.day],
            period: lessonToDelete.period,
          }}
        />
      )}
    </div>
  );
};
