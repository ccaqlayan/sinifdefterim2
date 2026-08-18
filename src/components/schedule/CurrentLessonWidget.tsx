import React, { useState } from 'react';
import { ScheduleConfig, ScheduleLesson, ClassRoom, AnnualPlanItem, AcademicYearConfig } from '../../types';
import { useCurrentLessonTracker } from '../../utils/currentLessonTracker';
import { getCurrentAcademicWeek } from '../../utils/termUtils';
import { findMatchingClass } from '../../utils/scheduleUtils';
import {
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Zap,
  Coffee,
  FileSpreadsheet,
  ChevronRight,
  Copy,
  Check,
  Monitor,
  Maximize2,
  X,
  GraduationCap,
  Info,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CurrentLessonWidgetProps {
  config: ScheduleConfig;
  lessons: ScheduleLesson[];
  classes: ClassRoom[];
  annualPlanItems?: AnnualPlanItem[];
  academicYearConfig?: AcademicYearConfig;
  onSelectClass?: (classId: string) => void;
  onNavigateSchedule?: () => void;
  onOpenPlanDetail?: (grade: string, classNameTitle: string, currentWeek: number) => void;
}

export const CurrentLessonWidget: React.FC<CurrentLessonWidgetProps> = ({
  config,
  lessons,
  classes,
  annualPlanItems = [],
  academicYearConfig,
  onSelectClass,
  onNavigateSchedule,
  onOpenPlanDetail,
}) => {
  const { status } = useCurrentLessonTracker(config, lessons, classes);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [isSmartBoardModalOpen, setIsSmartBoardModalOpen] = useState<boolean>(false);
  const [smartBoardTheme, setSmartBoardTheme] = useState<'dark' | 'light'>('dark');
  const [showDescription, setShowDescription] = useState<boolean>(false);

  // Helper to resolve grade and matching annual plan item for a lesson
  const getPlanItemForLessonAndClass = (lesson: ScheduleLesson | null, classId?: string) => {
    if (!lesson && !classId) return null;

    // 1. Resolve Class
    let targetClass: ClassRoom | undefined;
    if (classId) {
      targetClass = classes.find((c) => c.id === classId);
    }
    if (!targetClass && lesson) {
      targetClass = findMatchingClass(lesson, classes);
    }

    // 2. Resolve Grade String (clean digits)
    let extractedGrade = '';
    if (targetClass) {
      if (targetClass.grade) {
        extractedGrade = targetClass.grade.replace(/\D/g, '');
      } else {
        const match = targetClass.name.match(/\b(9|10|11|12|[5-8])\b/);
        extractedGrade = match ? match[1] : targetClass.name.replace(/\D/g, '');
      }
    } else if (lesson) {
      const match = (lesson.title + ' ' + (lesson.shortName || '')).match(/\b(9|10|11|12|[5-8])\b/);
      extractedGrade = match ? match[1] : (lesson.title + ' ' + (lesson.shortName || '')).replace(/\D/g, '');
    }

    // Default to '9' if not found or empty
    const cleanGrade = extractedGrade || '9';
    const activeWeek = getCurrentAcademicWeek(academicYearConfig);
    const classNameTitle = targetClass ? targetClass.name : (lesson ? lesson.title : `${cleanGrade}. Sınıf`);

    // 3. Filter Plan Items for this Grade
    const gradeItems = annualPlanItems.filter((i) => {
      const gNum = i.grade.replace(/\D/g, '');
      return gNum === cleanGrade || i.grade === cleanGrade || i.grade === `${cleanGrade}. Sınıf`;
    });

    if (gradeItems.length === 0) {
      return {
        planItem: null,
        grade: cleanGrade,
        classNameTitle,
        activeWeek,
        totalGradeItems: 0,
        targetClass,
      };
    }

    // 4. Find matching week
    let match = gradeItems.find((i) => i.week === activeWeek);
    if (!match) {
      // Fallback to closest week or first item
      match = gradeItems[0];
    }

    return {
      planItem: match,
      grade: cleanGrade,
      classNameTitle,
      activeWeek,
      totalGradeItems: gradeItems.length,
      targetClass,
    };
  };

  // Copy Kazanım / Konu text formatted for student notebooks or whiteboard
  const handleCopyNotebookText = (planItem: AnnualPlanItem, grade: string, week: number) => {
    const text =
      `📝 [${grade}. SINIF - ${week}. HAFTA KAZANIM VE KONU BİLGİSİ]\n` +
      `📚 Tema / Ünite: ${planItem.theme || '-'}\n` +
      `📌 Ders Konusu: ${planItem.topic || '-'}\n` +
      `🎯 Kazanım / Süreç Çıktısı: ${planItem.outcome || '-'}\n` +
      (planItem.dateRange ? `📅 Tarih Aralığı: ${planItem.dateRange}\n` : '') +
      (planItem.description ? `💡 Açıklamalar / Materyal: ${planItem.description}` : '');

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // State: NO_SCHEDULE
  if (status.state === 'NO_SCHEDULE') {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-800/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
              {status.badgeLabel}
            </span>
          </div>
          {onNavigateSchedule && (
            <button
              onClick={onNavigateSchedule}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>Program Ekle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">{status.statusTitle}</h4>
            <p className="text-xs text-indigo-200">{status.statusSubtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  // State: ONGOING (Canlı Ders Devam Ediyor)
  if (status.state === 'ONGOING' && status.currentLesson) {
    const planInfo = getPlanItemForLessonAndClass(status.currentLesson, status.currentClassId);
    const planItem = planInfo?.planItem;
    const grade = planInfo?.grade || '9';
    const activeWeek = planInfo?.activeWeek || 1;
    const targetClass = planInfo?.targetClass;

    return (
      <>
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-indigo-500/70 relative overflow-hidden space-y-4 animate-in fade-in duration-200">
          {/* Subtle background glow effect */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-500/40 flex items-center gap-1 shadow-xs">
                <Zap className="w-3 h-3 text-rose-400 fill-rose-400" /> CANLI DERS DEVAM EDİYOR
              </span>
            </div>

            <div className="flex items-center gap-2">
              {status.currentPeriod && (
                <span className="text-xs font-black bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-xl border border-indigo-400/30">
                  {status.currentPeriod.period}. Ders ({status.currentPeriod.startTime} - {status.currentPeriod.endTime})
                </span>
              )}
            </div>
          </div>

          {/* Lesson Banner & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-3.5">
              <div
                className="w-13 h-13 rounded-2xl text-white font-black flex items-center justify-center text-lg shadow-lg shrink-0 border border-white/20"
                style={{ backgroundColor: status.currentLesson.color || '#6366F1' }}
              >
                {status.currentLesson.shortName || 'DERS'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {status.currentLesson.title}
                  </h3>
                  {targetClass && (
                    <span className="text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {targetClass.name}
                    </span>
                  )}
                  <span className="text-[11px] font-bold bg-white/10 text-indigo-200 px-2 py-0.5 rounded-lg border border-white/10">
                    {grade}. Sınıf
                  </span>
                </div>
                <p className="text-xs text-indigo-200 font-medium mt-0.5">
                  {status.currentPeriod?.label} zaman aralığında aktif ders işleniyor
                </p>
              </div>
            </div>

            {/* Live Countdown & Class Jump Action */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap">
              <div className="bg-black/50 border border-white/15 px-3.5 py-2 rounded-2xl text-right">
                <span className="text-[9px] font-bold text-indigo-300 block uppercase tracking-wider">Bitimine Kalan</span>
                <span className="text-base font-black text-amber-300 tracking-tight flex items-center gap-1.5 justify-end">
                  <Clock className="w-4 h-4 animate-pulse text-amber-400" />
                  {status.formattedTimeRemaining}
                </span>
              </div>

              {status.currentClassId && onSelectClass ? (
                <button
                  onClick={() => onSelectClass(status.currentClassId!)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Sınıf yoklama ve performans tablosuna geç"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sınıf Ekranına Git</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : onNavigateSchedule ? (
                <button
                  onClick={onNavigateSchedule}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Program</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* YILLIK PLAN KAZANIM VE SÜREÇ ÇIKTISI PANELİ */}
          <div className="bg-slate-900/90 border border-indigo-400/40 rounded-2xl p-4 shadow-inner space-y-3 relative">
            {planItem ? (
              <>
                {/* Plan Metadata Header Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      YILLIK PLAN • {activeWeek}. HAFTA
                    </span>
                    {planItem.dateRange && (
                      <span className="text-[11px] font-bold text-amber-200/90 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Calendar className="w-3 h-3 text-amber-300" />
                        {planItem.dateRange}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1 truncate max-w-xs">
                    <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <strong>Tema / Ünite:</strong> {planItem.theme || 'Genel'}
                  </span>
                </div>

                {/* Topic / Konu */}
                <div className="text-sm font-black text-white flex items-start gap-2">
                  <span className="text-amber-400 font-extrabold text-xs shrink-0 mt-0.5">📌 Ders Konusu:</span>
                  <span className="text-amber-100 font-extrabold leading-snug">{planItem.topic || 'Belirtilmedi'}</span>
                </div>

                {/* Main Outcome / Kazanım - Süreç Çıktısı Box */}
                <div className="bg-indigo-950/70 border border-indigo-400/30 rounded-xl p-3 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Kazanım & Öğrenme / Süreç Çıktısı
                    </span>
                    <span className="text-[10px] text-indigo-300/80 font-bold">
                      {grade}. Sınıf Müfredatı
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed italic bg-black/20 p-2.5 rounded-lg border border-white/5">
                    "{planItem.outcome || 'Bu hafta için kazanım metni bulunmamaktadır.'}"
                  </p>

                  {/* Optional Description / Method Drawer */}
                  {planItem.description && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDescription(!showDescription)}
                        className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Info className="w-3 h-3 text-indigo-400" />
                        <span>Süreç Detayları ve Yöntem-Teknikler</span>
                        {showDescription ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {showDescription && (
                        <div className="mt-1.5 p-2 bg-black/30 rounded-lg text-[11px] text-slate-300 border border-white/10 leading-relaxed">
                          {planItem.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Action Toolbar for Outcome */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyNotebookText(planItem, grade, activeWeek)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        copiedToast
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white border border-white/15'
                      }`}
                      title="Deftere yazılacak konu ve kazanım metnini kopyala"
                    >
                      {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToast ? 'Kopyalandı!' : 'Deftere Kopyala'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSmartBoardModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-400/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Akıllı tahtada veya projeksiyonda büyük yazıyla yansıt"
                    >
                      <Monitor className="w-3.5 h-3.5 text-amber-400" />
                      <span>Akıllı Tahtaya Yansıt</span>
                    </button>
                  </div>

                  {onOpenPlanDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenPlanDetail(grade, planInfo?.classNameTitle || `${grade}. Sınıf`, activeWeek)}
                      className="px-3 py-1.5 bg-indigo-600/50 hover:bg-indigo-600/80 text-white font-bold text-xs rounded-xl border border-indigo-400/40 transition-all flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                      title="Bu sınıfın tüm yıllık planını görüntüle ve düzenle"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Tüm Yıllık Plan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* No plan uploaded prompt */
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 text-center sm:text-left">
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{grade}. Sınıf Yıllık Planı Bulunamadı</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Ders esnasında kazanım ve süreç çıktılarını canlı görmek için {grade}. sınıf yıllık planını Excel veya örnek şablon ile yükleyebilirsiniz.
                  </p>
                </div>

                {onOpenPlanDetail && (
                  <button
                    type="button"
                    onClick={() => onOpenPlanDetail(grade, planInfo?.classNameTitle || `${grade}. Sınıf`, activeWeek)}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Plan Yükle / Ekle</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AKILLI TAHTA MODAL (SMART BOARD PRESENTATION VIEW) */}
        {isSmartBoardModalOpen && planItem && (
          <div
            id="smart-board-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          >
            <div
              className={`w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 sm:p-8 shadow-2xl border flex flex-col justify-between overflow-y-auto ${
                smartBoardTheme === 'dark'
                  ? 'bg-slate-950 text-white border-indigo-500/40'
                  : 'bg-white text-slate-900 border-slate-300'
              }`}
            >
              {/* Modal Top Control Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-current/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                      <span>Akıllı Tahta Kazanım Ekranı</span>
                      <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md uppercase">
                        {grade}. Sınıf • {activeWeek}. Hafta
                      </span>
                    </h3>
                    <p className="text-xs opacity-75 font-medium">
                      {status.currentLesson.title} {targetClass ? `(${targetClass.name})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSmartBoardTheme(smartBoardTheme === 'dark' ? 'light' : 'dark')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-current/20 hover:bg-current/10 transition-all cursor-pointer"
                  >
                    {smartBoardTheme === 'dark' ? '☀️ Açık Tema' : '🌙 Koyu Tema'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSmartBoardModalOpen(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-current/10 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Huge Smart Board Content */}
              <div className="my-6 sm:my-8 space-y-6">
                {/* Theme & Week */}
                <div className="flex items-center gap-2 flex-wrap text-sm sm:text-base font-extrabold opacity-80">
                  <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-xl">
                    📚 Tema: {planItem.theme || 'Genel'}
                  </span>
                  {planItem.dateRange && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl">
                      🗓️ {planItem.dateRange}
                    </span>
                  )}
                </div>

                {/* Topic Headline */}
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm uppercase tracking-widest font-black text-amber-500">
                    📌 Günün Ders Konusu
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    {planItem.topic}
                  </h1>
                </div>

                {/* Outcome Callout Box */}
                <div
                  className={`p-6 rounded-3xl border-2 space-y-3 ${
                    smartBoardTheme === 'dark'
                      ? 'bg-indigo-950/60 border-indigo-400/50 shadow-xl'
                      : 'bg-indigo-50 border-indigo-300 shadow-lg'
                  }`}
                >
                  <span className="text-xs sm:text-sm uppercase tracking-widest font-black text-indigo-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    🎯 Hedef Öğrenme Çıktısı / Kazanım
                  </span>
                  <p className="text-xl sm:text-2xl font-bold leading-relaxed">
                    "{planItem.outcome}"
                  </p>
                </div>

                {/* Description if present */}
                {planItem.description && (
                  <div className="p-4 rounded-2xl bg-current/5 border border-current/10 text-xs sm:text-sm font-medium">
                    <span className="font-bold block text-amber-400 mb-1">💡 Notlar & Uygulama:</span>
                    {planItem.description}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-current/10 flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyNotebookText(planItem, grade, activeWeek)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {copiedToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedToast ? 'Metin Kopyalandı!' : 'Deftere Yazılacakları Kopyala'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSmartBoardModalOpen(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // State: BREAK (Teneffüs / Ders Arası)
  if (status.state === 'BREAK' && status.nextLesson) {
    const nextPlanInfo = getPlanItemForLessonAndClass(status.nextLesson, status.nextClassId);
    const nextPlanItem = nextPlanInfo?.planItem;
    const nextGrade = nextPlanInfo?.grade || '9';

    return (
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-amber-500/40 space-y-3.5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-400" /> {status.badgeLabel}
            </span>
          </div>

          {status.nextPeriod && (
            <span className="text-xs font-black bg-white/10 text-amber-200 px-2.5 py-1 rounded-xl border border-white/10">
              {status.nextPeriod.period}. Ders ({status.nextPeriod.startTime})
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white font-black flex items-center justify-center text-base shadow-sm shrink-0 border border-white/20"
              style={{ backgroundColor: status.nextLesson.color || '#F59E0B' }}
            >
              {status.nextLesson.shortName || 'DERS'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {status.nextLesson.title}
                </h3>
                <span className="text-[10px] font-bold bg-white/10 text-amber-200 px-2 py-0.5 rounded-md">
                  {nextGrade}. Sınıf
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {status.nextPeriod?.period}. ders saatiniz başlamak üzere
              </p>
            </div>
          </div>

          {/* Countdown timer & action button */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <div className="bg-black/40 border border-white/15 px-3.5 py-1.5 rounded-xl text-right">
              <span className="text-[9px] font-bold text-amber-300 block uppercase tracking-wider">Başlamasına Kalan</span>
              <span className="text-sm font-black text-amber-300 tracking-tight flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                {status.formattedTimeRemaining}
              </span>
            </div>

            {status.nextClassId && onSelectClass ? (
              <button
                onClick={() => onSelectClass(status.nextClassId!)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Sınıfa Hazırlan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : onNavigateSchedule ? (
              <button
                onClick={onNavigateSchedule}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Next Lesson Outcome Preview during Break */}
        {nextPlanItem && (
          <div className="bg-black/30 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] text-amber-300 font-extrabold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Gelecek Ders Kazanımı ({nextPlanItem.week}. Hafta - {nextGrade}. Sınıf)
              </span>
              <span className="text-slate-400">{nextPlanItem.theme}</span>
            </div>
            <p className="text-amber-100 font-bold">📌 Konu: {nextPlanItem.topic}</p>
            <p className="text-slate-300 line-clamp-1 italic text-[11px]">"{nextPlanItem.outcome}"</p>
          </div>
        )}
      </div>
    );
  }

  // State: FINISHED_TODAY or NO_LESSONS_TODAY
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-800/40 space-y-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {status.badgeLabel}
          </span>
        </div>

        {onNavigateSchedule && (
          <button
            onClick={onNavigateSchedule}
            className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
          >
            <span>Ders Programı</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        {status.nextLesson ? (
          <>
            <div
              className="w-10 h-10 rounded-2xl text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0 border border-white/20"
              style={{ backgroundColor: status.nextLesson.color || '#6366F1' }}
            >
              {status.nextLesson.shortName || 'DERS'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">{status.nextLesson.title}</h4>
                <span className="text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md">
                  {status.nextLessonDayName}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {status.nextPeriod ? `${status.nextPeriod.period}. Ders (${status.nextPeriod.startTime})` : ''}
              </p>
            </div>
          </>
        ) : (
          <div>
            <h4 className="text-sm font-black text-white">{status.statusTitle}</h4>
            <p className="text-xs text-indigo-200">{status.statusSubtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
};
