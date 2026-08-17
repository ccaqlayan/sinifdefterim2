import React, { useState, useEffect, useMemo } from 'react';
import {
  ClassRoom,
  Student,
  PerformanceLog,
  Quiz,
  QuizScore,
  Homework,
  HomeworkRecord,
  NotebookControl,
  ScheduleConfig,
  ScheduleLesson,
  AcademicYearConfig,
} from '../types';
import {
  getWeekRange,
  getPreviousWeekMonday,
  getNextWeekMonday,
  isDateInWeek,
  formatFriendlyDateTR,
  toDateString,
} from '../utils/weeklyUtils';
import { DAY_FULL_NAMES, ALL_DAYS } from '../utils/scheduleUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  AlertTriangle,
  BookMarked,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Copy,
  Printer,
  ArrowLeft,
  TrendingUp,
  Flame,
  CheckSquare,
  Users,
  Check,
  MessageCircle,
  HelpCircle,
  BarChart2,
  X,
  FileText,
  PieChart,
} from 'lucide-react';

interface WeeklySummaryViewProps {
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
  scheduleConfig?: ScheduleConfig;
  scheduleLessons?: ScheduleLesson[];
  academicYearConfig?: AcademicYearConfig;
  onBackToDashboard: () => void;
  onNavigateTab: (tab: string) => void;
}

interface SectionVisibilitySettings {
  showTopStars: boolean;
  showMissingHomework: boolean;
  showLessonHours: boolean;
  showNotebookSummary: boolean;
  showQuizSummary: boolean;
  showCategoryBreakdown: boolean;
  showParentNoticeList: boolean;
}

const DEFAULT_SECTION_SETTINGS: SectionVisibilitySettings = {
  showTopStars: true,
  showMissingHomework: true,
  showLessonHours: true,
  showNotebookSummary: true,
  showQuizSummary: true,
  showCategoryBreakdown: true,
  showParentNoticeList: true,
};

export const WeeklySummaryView: React.FC<WeeklySummaryViewProps> = ({
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
  scheduleConfig,
  scheduleLessons = [],
  academicYearConfig,
  onBackToDashboard,
  onNavigateTab,
}) => {
  // 1. Week reference date (defaults to today's date string YYYY-MM-DD)
  const [referenceDateStr, setReferenceDateStr] = useState<string>(() => toDateString(new Date()));
  const [classFilter, setClassFilter] = useState<string>(selectedClassId || 'all');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);

  // 2. Section Visibility Settings (stored in localStorage)
  const [sectionSettings, setSectionSettings] = useState<SectionVisibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('teacher_weekly_summary_settings');
      if (saved) {
        return { ...DEFAULT_SECTION_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SECTION_SETTINGS;
  });

  const updateSectionSetting = (key: keyof SectionVisibilitySettings, value: boolean) => {
    const updated = { ...sectionSettings, [key]: value };
    setSectionSettings(updated);
    try {
      localStorage.setItem('teacher_weekly_summary_settings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetSectionSettings = () => {
    setSectionSettings(DEFAULT_SECTION_SETTINGS);
    try {
      localStorage.setItem('teacher_weekly_summary_settings', JSON.stringify(DEFAULT_SECTION_SETTINGS));
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Computed Week Info
  const weekInfo = useMemo(() => {
    return getWeekRange(referenceDateStr);
  }, [referenceDateStr]);

  // 4. Filtered Students list based on class filter
  const targetStudents = useMemo(() => {
    if (classFilter === 'all') return students;
    return students.filter((s) => s.classId === classFilter);
  }, [students, classFilter]);

  const targetStudentIds = useMemo(() => new Set(targetStudents.map((s) => s.id)), [targetStudents]);

  // 5. Weekly Plus/Minus Performance Logs
  const weeklyLogs = useMemo(() => {
    return plusMinusLogs.filter((log) => {
      if (!isDateInWeek(log.date, weekInfo.startDateStr, weekInfo.endDateStr)) return false;
      if (classFilter !== 'all' && log.classId !== classFilter) return false;
      return true;
    });
  }, [plusMinusLogs, weekInfo, classFilter]);

  const weeklyPlusCount = weeklyLogs.filter((l) => l.type === 'plus').length;
  const weeklyMinusCount = weeklyLogs.filter((l) => l.type === 'minus').length;
  const evaluatedStudentCount = new Set(weeklyLogs.map((l) => l.studentId)).size;

  // 6. Top Plus Earners (Weekly Stars)
  const topStudentsRanking = useMemo(() => {
    const map: {
      [studentId: string]: {
        student: Student;
        plus: number;
        minus: number;
        net: number;
        categories: { [cat: string]: number };
      };
    } = {};

    weeklyLogs.forEach((log) => {
      const std = students.find((s) => s.id === log.studentId);
      if (!std) return;
      if (!map[std.id]) {
        map[std.id] = {
          student: std,
          plus: 0,
          minus: 0,
          net: 0,
          categories: {},
        };
      }
      if (log.type === 'plus') {
        map[std.id].plus += 1;
        map[std.id].categories[log.category] = (map[std.id].categories[log.category] || 0) + 1;
      } else {
        map[std.id].minus += 1;
      }
      map[std.id].net = map[std.id].plus - map[std.id].minus;
    });

    return Object.values(map)
      .filter((item) => item.plus > 0)
      .sort((a, b) => b.plus - a.plus || b.net - a.net);
  }, [weeklyLogs, students]);

  // 7. Weekly Homework & Missing Homework Records
  const weeklyHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      if (hw.isDeleted) return false;
      if (classFilter !== 'all' && hw.classId !== classFilter) return false;
      // Match by dueDate falling in this week or assignedDate in this week
      return (
        isDateInWeek(hw.dueDate, weekInfo.startDateStr, weekInfo.endDateStr) ||
        isDateInWeek(hw.assignedDate, weekInfo.startDateStr, weekInfo.endDateStr)
      );
    });
  }, [homeworks, weekInfo, classFilter]);

  const weeklyMissingHomeworkList = useMemo(() => {
    const list: {
      record: HomeworkRecord;
      student: Student;
      homework: Homework;
      classRoom?: ClassRoom;
    }[] = [];

    weeklyHomeworks.forEach((hw) => {
      const hwRecs = homeworkRecords.filter((r) => r.homeworkId === hw.id);
      const hwClass = classes.find((c) => c.id === hw.classId);

      hwRecs.forEach((rec) => {
        if (rec.status === 'missing' || rec.status === 'partial') {
          const std = students.find((s) => s.id === rec.studentId);
          if (std && (classFilter === 'all' || std.classId === classFilter)) {
            list.push({
              record: rec,
              student: std,
              homework: hw,
              classRoom: hwClass,
            });
          }
        }
      });
    });

    return list;
  }, [weeklyHomeworks, homeworkRecords, students, classes, classFilter]);

  const totalWeeklyHomeworkRecords = useMemo(() => {
    let count = 0;
    weeklyHomeworks.forEach((hw) => {
      const records = homeworkRecords.filter((r) => r.homeworkId === hw.id && targetStudentIds.has(r.studentId));
      count += records.length;
    });
    return count;
  }, [weeklyHomeworks, homeworkRecords, targetStudentIds]);

  const completedWeeklyHomeworkCount = useMemo(() => {
    let count = 0;
    weeklyHomeworks.forEach((hw) => {
      const records = homeworkRecords.filter(
        (r) =>
          r.homeworkId === hw.id &&
          targetStudentIds.has(r.studentId) &&
          (r.status === 'completed' || r.status === 'excused')
      );
      count += records.length;
    });
    return count;
  }, [weeklyHomeworks, homeworkRecords, targetStudentIds]);

  const homeworkCompletionRate =
    totalWeeklyHomeworkRecords > 0
      ? Math.round((completedWeeklyHomeworkCount / totalWeeklyHomeworkRecords) * 100)
      : null;

  // 8. Weekly Notebook Controls
  const weeklyNotebooks = useMemo(() => {
    return notebookControls.filter((n) => {
      if (!isDateInWeek(n.date, weekInfo.startDateStr, weekInfo.endDateStr)) return false;
      if (classFilter !== 'all' && n.classId !== classFilter) return false;
      return true;
    });
  }, [notebookControls, weekInfo, classFilter]);

  const notebookAveragePct =
    weeklyNotebooks.length > 0
      ? Math.round(weeklyNotebooks.reduce((acc, n) => acc + n.percentage, 0) / weeklyNotebooks.length)
      : null;

  const lowNotebookStudents = useMemo(() => {
    return weeklyNotebooks
      .filter((n) => n.percentage < 60)
      .map((n) => ({
        control: n,
        student: students.find((s) => s.id === n.studentId),
        classRoom: classes.find((c) => c.id === n.classId),
      }))
      .filter((item) => !!item.student);
  }, [weeklyNotebooks, students, classes]);

  // 9. Weekly Quizzes
  const weeklyQuizzes = useMemo(() => {
    return quizDefinitions.filter((q) => {
      if (q.isDeleted) return false;
      if (classFilter !== 'all' && q.classId !== classFilter) return false;
      return isDateInWeek(q.date, weekInfo.startDateStr, weekInfo.endDateStr);
    });
  }, [quizDefinitions, weekInfo, classFilter]);

  const weeklyQuizStats = useMemo(() => {
    const list: {
      quiz: Quiz;
      scores: QuizScore[];
      average: number | null;
      highest: number | null;
      lowest: number | null;
      count: number;
    }[] = [];

    weeklyQuizzes.forEach((quiz) => {
      const qScores = quizzes.filter(
        (qs) => (qs.quizId ? qs.quizId === quiz.id : qs.quizTitle === quiz.title) && targetStudentIds.has(qs.studentId)
      );

      const numScores = qScores.map((s) => s.score);
      const avg =
        numScores.length > 0 ? Math.round(numScores.reduce((a, b) => a + b, 0) / numScores.length) : null;
      const highest = numScores.length > 0 ? Math.max(...numScores) : null;
      const lowest = numScores.length > 0 ? Math.min(...numScores) : null;

      list.push({
        quiz,
        scores: qScores,
        average: avg,
        highest,
        lowest,
        count: numScores.length,
      });
    });

    return list;
  }, [weeklyQuizzes, quizzes, targetStudentIds]);

  // 10. Schedule Lesson Hours
  const weeklyScheduleStats = useMemo(() => {
    const activeDays = scheduleConfig?.activeDays || ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
    const filteredLessons = scheduleLessons.filter((l) => {
      if (!activeDays.includes(l.day)) return false;
      if (classFilter !== 'all' && l.classId !== classFilter) return false;
      return true;
    });

    const dayBreakdown: { [day: string]: number } = {
      Pzt: 0,
      Sal: 0,
      Çar: 0,
      Per: 0,
      Cum: 0,
      Cmt: 0,
      Paz: 0,
    };

    const classBreakdown: { [className: string]: number } = {};

    filteredLessons.forEach((l) => {
      dayBreakdown[l.day] = (dayBreakdown[l.day] || 0) + 1;
      const clsName = classes.find((c) => c.id === l.classId)?.name || l.shortName || l.title || 'Diğer';
      classBreakdown[clsName] = (classBreakdown[clsName] || 0) + 1;
    });

    return {
      totalHours: filteredLessons.length,
      dayBreakdown,
      classBreakdown,
      lessons: filteredLessons,
    };
  }, [scheduleConfig, scheduleLessons, classFilter, classes]);

  // 11. Category Breakdown of Plus / Minus Logs
  const categoryStats = useMemo(() => {
    const map: { [cat: string]: { plus: number; minus: number; total: number } } = {};
    weeklyLogs.forEach((l) => {
      if (!map[l.category]) {
        map[l.category] = { plus: 0, minus: 0, total: 0 };
      }
      if (l.type === 'plus') {
        map[l.category].plus += 1;
      } else {
        map[l.category].minus += 1;
      }
      map[l.category].total += 1;
    });

    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [weeklyLogs]);

  // Copy WhatsApp / Text Summary
  const handleCopySummaryText = () => {
    const activeClassName =
      classFilter === 'all' ? 'Tüm Sınıflar' : classes.find((c) => c.id === classFilter)?.name || 'Sınıf';

    let text = `📊 *HAFTALIK DERS VE PERFORMANS ÖZETİ*\n`;
    text += `📅 *Hafta:* ${weekInfo.formattedLabel} (${weekInfo.weekNumber}. Hafta)\n`;
    text += `🏫 *Sınıf:* ${activeClassName}\n`;
    text += `⏱️ *Toplam İşlenen Ders Saati:* ${weeklyScheduleStats.totalHours} Saat\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (sectionSettings.showTopStars && topStudentsRanking.length > 0) {
      text += `⭐ *HAFTANIN YILDIZLARI (En Çok Artı Alanlar):*\n`;
      topStudentsRanking.slice(0, 5).forEach((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '✨';
        const cls = classes.find((c) => c.id === item.student.classId)?.name || '';
        text += `${medal} ${item.student.name} ${item.student.surname} ${cls ? `(${cls})` : ''}: +${item.plus} Artı\n`;
      });
      text += `\n`;
    }

    if (sectionSettings.showMissingHomework) {
      text += `⚠️ *ÖDEV DURUMU:*\n`;
      if (homeworkCompletionRate !== null) {
        text += `• Teslim Başarı Oranı: %${homeworkCompletionRate}\n`;
      }
      if (weeklyMissingHomeworkList.length > 0) {
        text += `• Eksik / Getirilmeyen Ödevler (${weeklyMissingHomeworkList.length} Adet):\n`;
        weeklyMissingHomeworkList.slice(0, 8).forEach((item) => {
          text += `  - ${item.student.name} ${item.student.surname} -> ${item.homework.title} (${
            item.record.status === 'missing' ? 'Getirmedi' : 'Eksik'
          })\n`;
        });
      } else {
        text += `• Bu hafta tüm ödevler eksiksiz teslim edildi! 👏\n`;
      }
      text += `\n`;
    }

    if (sectionSettings.showNotebookSummary && weeklyNotebooks.length > 0) {
      text += `📓 *DEFTER KONTROLÜ:*\n`;
      text += `• Kontrol Edilen: ${weeklyNotebooks.length} Öğrenci\n`;
      text += `• Sınıf Tamlık Ortalaması: %${notebookAveragePct || 0}\n`;
      if (lowNotebookStudents.length > 0) {
        text += `• %60 Altı Kalanlar: ${lowNotebookStudents.length} Öğrenci\n`;
      }
      text += `\n`;
    }

    if (sectionSettings.showQuizSummary && weeklyQuizzes.length > 0) {
      text += `🎯 *HAFTANIN QUİZLERİ:*\n`;
      weeklyQuizStats.forEach((qs) => {
        text += `• ${qs.quiz.title}: Ort. ${qs.average || '-'} Puan (En Yüksek: ${qs.highest || '-'}, En Düşük: ${
          qs.lowest || '-'
        })\n`;
      });
      text += `\n`;
    }

    text += `✨ *Sınıf Defterim Takip Sistemi* ile hazırlandı.`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Header Navigation & Controls */}
      <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-200/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Back button & Title */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center"
              title="Anasayfaya Geri Dön"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Haftalık Özet Raporu
                </h2>
                {weekInfo.isCurrentWeek && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    Bu Hafta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Öğrenci başarıları, ödev eksikleri ve haftalık ders istatistikleri
              </p>
            </div>
          </div>

          {/* Action buttons: Customize, Copy, Print */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsCustomizeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Görünecek bölümleri aç / kapat"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Özelleştir</span>
            </button>

            <button
              onClick={handleCopySummaryText}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs text-white ${
                copiedToast
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              title="WhatsApp veya Notlar için metin kopyala"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Kopyalandı!' : 'Özeti Kopyala'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="Yazdır / PDF Olarak Kaydet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date / Week Navigator & Class Filter Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* Week Selector Navigator */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setReferenceDateStr(getPreviousWeekMonday(weekInfo.startDateStr))}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Önceki Hafta"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2 py-0.5 text-center flex items-center gap-1.5 min-w-[170px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-xs font-extrabold text-slate-900 select-none">
                {weekInfo.formattedLabel}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                {weekInfo.weekNumber}. Hf
              </span>
            </div>

            <button
              onClick={() => setReferenceDateStr(getNextWeekMonday(weekInfo.startDateStr))}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Sonraki Hafta"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!weekInfo.isCurrentWeek && (
              <button
                onClick={() => setReferenceDateStr(toDateString(new Date()))}
                className="ml-1 text-[10px] font-black px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-all cursor-pointer"
              >
                Bu Hafta
              </button>
            )}
          </div>

          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden md:inline">
              Filtrele:
            </span>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                if (e.target.value !== 'all') {
                  onSelectClass(e.target.value);
                }
              }}
              className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs py-1.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition-all"
            >
              <option value="all">Tüm Sınıflar ({classes.length} Sınıf)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.subject})
                </option>
              ))}
            </select>

            {/* Custom Date Input for Quick Jump */}
            <input
              type="date"
              value={referenceDateStr}
              onChange={(e) => {
                if (e.target.value) setReferenceDateStr(e.target.value);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 px-2 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              title="Farklı bir tarihe git"
            />
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Total Lessons */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0 border border-blue-100">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 truncate">Haftalık Ders Saati</p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {weeklyScheduleStats.totalHours} <span className="text-xs font-semibold text-slate-500">Saat</span>
            </h4>
          </div>
        </div>

        {/* Metric 2: Plus & Minus Total */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 truncate">Verilen Artı / Eksi</p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <span className="text-emerald-700 font-black">+{weeklyPlusCount}</span>
              <span className="text-slate-300">/</span>
              <span className="text-rose-600 font-bold">-{weeklyMinusCount}</span>
            </h4>
          </div>
        </div>

        {/* Metric 3: Homework Delivery Rate */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black shrink-0 border border-sky-100">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 truncate">Ödev Teslim Oranı</p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {homeworkCompletionRate !== null ? (
                <span>%{homeworkCompletionRate}</span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Ödev Yok</span>
              )}
            </h4>
          </div>
        </div>

        {/* Metric 4: Notebook Average */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0 border border-amber-100">
            <BookMarked className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 truncate">Defter Ortalaması</p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {notebookAveragePct !== null ? (
                <span>%{notebookAveragePct}</span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Kontrol Yok</span>
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* SECTION 1: TOP STARS (En Çok Artı Alan Öğrenciler) */}
      {sectionSettings.showTopStars && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Haftanın Yıldızları (En Çok Artı Alanlar)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Bu hafta ders içi performans ve katılımda en yüksek artı puanı toplayan öğrenciler
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              {topStudentsRanking.length} Öğrenci
            </span>
          </div>

          {topStudentsRanking.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Bu hafta için henüz artı puan kaydı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Podium Top 3 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {topStudentsRanking.slice(0, 3).map((item, index) => {
                  const medalColors = [
                    'bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/20',
                    'bg-linear-to-br from-slate-400 to-slate-500 text-white shadow-slate-400/20',
                    'bg-linear-to-br from-amber-700 to-amber-800 text-white shadow-amber-700/20',
                  ];
                  const rankLabels = ['1. Sıra 🥇', '2. Sıra 🥈', '3. Sıra 🥉'];
                  const cls = classes.find((c) => c.id === item.student.classId);

                  return (
                    <div
                      key={item.student.id}
                      className="bg-linear-to-b from-amber-50/40 via-white to-slate-50/60 p-3.5 rounded-2xl border-2 border-amber-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${medalColors[index]}`}
                        >
                          {rankLabels[index]}
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          +{item.plus} Artı
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 my-1">
                        <img
                          src={
                            item.student.photoUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.student.name + ' ' + item.student.surname
                            )}&background=f59e0b&color=fff`
                          }
                          alt=""
                          className="w-10 h-10 rounded-2xl object-cover border border-amber-300 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                            {item.student.name} {item.student.surname}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {cls?.name || 'Sınıf'} • No: {item.student.number}
                          </p>
                        </div>
                      </div>

                      {/* Top Category Tag */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-medium">Net Puan:</span>
                        <span className="font-black text-slate-800">
                          {item.net > 0 ? `+${item.net}` : item.net}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Other Top Students List (4th to 10th) */}
              {topStudentsRanking.length > 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {topStudentsRanking.slice(3, 9).map((item, idx) => {
                    const cls = classes.find((c) => c.id === item.student.classId);
                    return (
                      <div
                        key={item.student.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 4}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.student.name} {item.student.surname}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {cls?.name} • No: {item.student.number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            +{item.plus}
                          </span>
                          {item.minus > 0 && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                              -{item.minus}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: MISSING / INCOMPLETE HOMEWORKS (Ödevini Getirmeyenler) */}
      {sectionSettings.showMissingHomework && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Ödevini Getirmeyen ve Eksik Olan Öğrenciler
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Bu hafta teslim edilmesi gereken ödevlerde tespit edilen eksikler
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                weeklyMissingHomeworkList.length > 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {weeklyMissingHomeworkList.length > 0
                ? `${weeklyMissingHomeworkList.length} Eksik`
                : 'Tüm Ödevler Tamam'}
            </span>
          </div>

          {weeklyMissingHomeworkList.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Harika! Bu haftaki ödevlerde hiçbir öğrencinin eksiği bulunmuyor.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {weeklyMissingHomeworkList.map((item, idx) => (
                <div
                  key={`${item.record.id}-${idx}`}
                  className="p-3 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl border border-rose-200/80 flex items-start justify-between gap-2.5 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={
                        item.student.photoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.student.name + ' ' + item.student.surname
                        )}&background=e11d48&color=fff`
                      }
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover border border-rose-300 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {item.student.name} {item.student.surname}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {item.classRoom?.name} • No: {item.student.number}
                      </p>
                      <p className="text-[11px] font-bold text-rose-900 mt-1 line-clamp-1">
                        📝 {item.homework.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                        item.record.status === 'missing'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.record.status === 'missing' ? 'Getirmedi' : 'Eksik / Yarım'}
                    </span>

                    {item.student.parentPhone && (
                      <a
                        href={`https://wa.me/${item.student.parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Sayın Veli, ${item.student.name} ${item.student.surname} isimli öğrencimizin ${item.homework.title} başlıklı ödevinde eksik tespit edilmiştir. Bilgilerinize sunarız.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                        title="Veliye WhatsApp hatırlatması gönder"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Veliye İlet
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: LESSON HOURS & SCHEDULE TIMETABLE (İşlenen Ders Saatleri) */}
      {sectionSettings.showLessonHours && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  İşlenen Ders Saatleri & Program Dağılımı
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Haftalık çizelgedeki toplam ders saati ve günlere göre dağılım
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              Programı Aç →
            </button>
          </div>

          {/* Daily Schedule Hour Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {ALL_DAYS.slice(0, 5).map((dayKey) => {
              const hours = weeklyScheduleStats.dayBreakdown[dayKey] || 0;
              return (
                <div
                  key={dayKey}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    hours > 0
                      ? 'bg-blue-50/50 border-blue-200/80 text-blue-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {DAY_FULL_NAMES[dayKey]}
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    {hours} <span className="text-[11px] font-semibold text-slate-500">Saat</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Class Breakdown Pills */}
          {Object.keys(weeklyScheduleStats.classBreakdown).length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Sınıf Dağılımı:</span>
              {Object.entries(weeklyScheduleStats.classBreakdown).map(([clsName, count]) => (
                <span
                  key={clsName}
                  className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200"
                >
                  {clsName}: <strong className="text-blue-700">{count} Saat</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: NOTEBOOK STATUS SUMMARY (Defter Kontrol Özeti) */}
      {sectionSettings.showNotebookSummary && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Haftalık Defter Kontrol Özeti
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Bu hafta yapılan defter kontrolleri ve tamlık yüzdeleri
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('notebook')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              Deftere Git →
            </button>
          </div>

          {weeklyNotebooks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Bu hafta henüz defter kontrol verisi girilmemiş.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Kontrol Edilen</span>
                  <span className="text-sm font-black text-slate-900">{weeklyNotebooks.length} Öğrenci</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 block">Tam (%100)</span>
                  <span className="text-sm font-black text-emerald-900">
                    {weeklyNotebooks.filter((n) => n.percentage === 100).length} Öğrenci
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 block">Haftalık Ortalama</span>
                  <span className="text-sm font-black text-amber-900">%{notebookAveragePct || 0}</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 block">%60 Altı (Eksik)</span>
                  <span className="text-sm font-black text-rose-900">{lowNotebookStudents.length} Öğrenci</span>
                </div>
              </div>

              {lowNotebookStudents.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700 mb-1.5">
                    ⚠️ Defterini Tamamlaması Gerekenler:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {lowNotebookStudents.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl"
                      >
                        {item.student?.name} {item.student?.surname} (%{item.control.percentage})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: QUIZZES & EXAMS CONDUCTED THIS WEEK */}
      {sectionSettings.showQuizSummary && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Haftanın Quiz ve Sınav Sonuçları
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Bu hafta uygulanan kısa sınavlar ve sınıf başarı grafiği
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('quiz-hw')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
            >
              Quizlere Git →
            </button>
          </div>

          {weeklyQuizStats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Bu hafta planlanan veya uygulanan quiz kaydı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2.5">
              {weeklyQuizStats.map((qs) => {
                const cls = classes.find((c) => c.id === qs.quiz.classId);
                return (
                  <div
                    key={qs.quiz.id}
                    className="p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                          {cls?.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Tarih: {qs.quiz.date}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1">{qs.quiz.title}</h4>
                      {qs.quiz.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{qs.quiz.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-indigo-100 text-xs shrink-0 self-start sm:self-center">
                      <div className="text-center px-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Ortalama</span>
                        <span className="font-black text-indigo-700 text-sm">
                          {qs.average !== null ? `${qs.average}` : '-'}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <div className="text-center px-2">
                        <span className="text-[10px] text-slate-400 block font-medium">En Yüksek</span>
                        <span className="font-black text-emerald-600 text-sm">
                          {qs.highest !== null ? `${qs.highest}` : '-'}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <div className="text-center px-2">
                        <span className="text-[10px] text-slate-400 block font-medium">En Düşük</span>
                        <span className="font-black text-rose-600 text-sm">
                          {qs.lowest !== null ? `${qs.lowest}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: BEHAVIOR & CATEGORY ANALYSIS (Davranış & Kategori Dağılımı) */}
      {sectionSettings.showCategoryBreakdown && categoryStats.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Haftalık Davranış ve Kategori Analizi
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Katılım, ödev, sınıf kuralları ve soru çözümü kategorilerinde verilen geri bildirimler
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Toplam {weeklyLogs.length} Değerlendirme
            </span>
          </div>

          <div className="space-y-2.5">
            {categoryStats.map(([catName, stats]) => {
              const plusPct = stats.total > 0 ? Math.round((stats.plus / stats.total) * 100) : 0;

              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{catName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-black">+{stats.plus} Artı</span>
                      {stats.minus > 0 && (
                        <span className="text-rose-600 font-bold">-{stats.minus} Eksi</span>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${plusPct}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${100 - plusPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CUSTOMIZE MODAL / DRAWER */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Rapor Bölümlerini Özelleştir</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Haftalık özette görünmesini istediğiniz alanları seçin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {[
                {
                  key: 'showTopStars' as const,
                  label: 'Haftanın Yıldızları (En Çok Artı Alanlar)',
                  desc: 'Haftanın en başarılı ilk 3 öğrencisi ve sıralama listesi',
                },
                {
                  key: 'showMissingHomework' as const,
                  label: 'Ödevini Getirmeyen ve Eksik Olanlar',
                  desc: 'Haftalık ödev kontrolünde eksiği tespit edilen öğrenciler',
                },
                {
                  key: 'showLessonHours' as const,
                  label: 'İşlenen Toplam Ders Saati & Program',
                  desc: 'Haftalık ders saatleri ve günlere göre ders dağılımı',
                },
                {
                  key: 'showNotebookSummary' as const,
                  label: 'Haftalık Defter Kontrol Özeti',
                  desc: 'Defter kontrol ortalamaları ve eksik kalan öğrenciler',
                },
                {
                  key: 'showQuizSummary' as const,
                  label: 'Quiz ve Sınav Sonuçları',
                  desc: 'Bu hafta yapılan kısa sınavlar ve sınıf ortalaması',
                },
                {
                  key: 'showCategoryBreakdown' as const,
                  label: 'Davranış & Kategori Analizi',
                  desc: 'Katılım, ödev, kurallar bazında artı/eksi dağılımı',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sectionSettings[item.key]}
                    onChange={(e) => updateSectionSetting(item.key, e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer mt-0.5"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetSectionSettings}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Varsayılana Sıfırla
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Kaydet ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
