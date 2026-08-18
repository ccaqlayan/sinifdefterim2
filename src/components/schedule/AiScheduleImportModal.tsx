import React, { useState, useRef, useMemo } from 'react';
import { ScheduleConfig, ScheduleDay, ScheduleLesson, PeriodTime, ClassRoom } from '../../types';
import { 
  COLOR_PALETTE, 
  DISTINCT_CLASS_COLORS, 
  DAY_FULL_NAMES, 
  detectLunchBreakFromPeriodTimes,
  findMatchingClass
} from '../../utils/scheduleUtils';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Palette, 
  RefreshCw, 
  ShieldAlert, 
  Calendar, 
  Scissors, 
  Coffee,
  HelpCircle,
  Check,
  Building2,
  User,
  GraduationCap,
  Link2
} from 'lucide-react';

interface ParsedLessonItem {
  day: ScheduleDay;
  period: number;
  className?: string;
  subjectCode?: string;
  subjectName?: string;
  title?: string;
  shortName?: string;
  cleanShortName?: string;
  color?: string;
  startTime?: string;
  endTime?: string;
}

interface ParsedScheduleResponse {
  success?: boolean;
  schoolName?: string;
  teacherName?: string;
  mentorship?: string;
  dutyInfo?: string;
  startDate?: string;
  totalWeeklyHours?: number;
  periodsPerDay?: number;
  lunchBreakAfterPeriod?: number;
  lunchBreakMinutes?: number;
  periodTimes?: PeriodTime[];
  uniqueGroups?: Array<{
    groupKey: string;
    className?: string;
    subjectCode?: string;
    subjectName?: string;
    color?: string;
    weeklyHours?: number;
  }>;
  lessons?: ParsedLessonItem[];
  error?: string;
}

interface AiScheduleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLessonsCount: number;
  currentConfig: ScheduleConfig;
  classes?: ClassRoom[];
  onApplySchedule: (newLessons: ScheduleLesson[], newConfig: ScheduleConfig, auditDetails?: string) => void;
}

export const AiScheduleImportModal: React.FC<AiScheduleImportModalProps> = ({
  isOpen,
  onClose,
  existingLessonsCount,
  currentConfig,
  classes = [],
  onApplySchedule,
}) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzingStatus, setAnalyzingStatus] = useState<string>('Görsel taranıyor...');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Parsed data state
  const [parsedData, setParsedData] = useState<ParsedScheduleResponse | null>(null);
  
  // Group colors state: key is `className###subjectKey`
  const [groupColors, setGroupColors] = useState<Record<string, string>>({});
  const [activeColorPickerKey, setActiveColorPickerKey] = useState<string | null>(null);

  // Option 1: Clean code from shortName (strip MAT4, TSOS etc. so only 12/C shows)
  const [stripCodesFromShortName, setStripCodesFromShortName] = useState<boolean>(true);

  // Option 2: Overwrite existing lessons confirmation
  const [userConfirmedOverwrite, setUserConfirmedOverwrite] = useState<boolean>(existingLessonsCount === 0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to build unique group key for a lesson
  const getLessonGroupKey = (lesson: ParsedLessonItem | { className?: string; subjectCode?: string; subjectName?: string }): string => {
    const cName = (lesson.className || 'Ders').trim();
    const sName = (lesson.subjectCode || lesson.subjectName || 'Genel').trim();
    return `${cName}###${sName}`;
  };

  // Extract unique class/subject groups
  const uniqueClassGroups = useMemo(() => {
    if (!parsedData || !parsedData.lessons) return [];

    const map = new Map<string, {
      key: string;
      className: string;
      subjectCode: string;
      subjectName: string;
      weeklyHours: number;
    }>();

    parsedData.lessons.forEach((l) => {
      const key = getLessonGroupKey(l);
      const cName = (l.className || 'Ders').trim();
      const sCode = (l.subjectCode || '').trim();
      const sName = (l.subjectName || sCode || 'Ders').trim();

      if (!map.has(key)) {
        map.set(key, {
          key,
          className: cName,
          subjectCode: sCode,
          subjectName: sName,
          weeklyHours: 1,
        });
      } else {
        const item = map.get(key)!;
        item.weeklyHours += 1;
      }
    });

    return Array.from(map.values());
  }, [parsedData]);

  // Detect lunch break dynamically
  const lunchBreakInfo = useMemo(() => {
    if (!parsedData?.periodTimes || parsedData.periodTimes.length === 0) {
      return {
        lunchBreakAfterPeriod: parsedData?.lunchBreakAfterPeriod,
        lunchBreakMinutes: parsedData?.lunchBreakMinutes,
        startPeriodTime: undefined,
        endPeriodTime: undefined,
      };
    }

    const detected = detectLunchBreakFromPeriodTimes(parsedData.periodTimes);
    const afterPeriod = parsedData.lunchBreakAfterPeriod || detected.lunchBreakAfterPeriod;
    const durationMinutes = parsedData.lunchBreakMinutes || detected.lunchBreakMinutes;

    let startPeriodTime: PeriodTime | undefined;
    let endPeriodTime: PeriodTime | undefined;

    if (afterPeriod) {
      startPeriodTime = parsedData.periodTimes.find((p) => p.period === afterPeriod);
      endPeriodTime = parsedData.periodTimes.find((p) => p.period === afterPeriod + 1);
    }

    return {
      lunchBreakAfterPeriod: afterPeriod,
      lunchBreakMinutes: durationMinutes,
      startPeriodTime,
      endPeriodTime,
    };
  }, [parsedData]);

  if (!isOpen) return null;

  // File Upload Handler
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası (.jpg, .png, .webp) seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Trigger AI Analysis
  const handleStartAnalysis = async () => {
    if (!imageBase64) return;

    setStep('analyzing');
    setAnalysisError(null);
    setAnalyzingStatus('Ders programı fotoğrafı taranıyor...');

    const statusTimer1 = setTimeout(() => {
      setAnalyzingStatus('Ders saatleri ve öğle arası aralıkları inceleniyor...');
    }, 1800);

    const statusTimer2 = setTimeout(() => {
      setAnalyzingStatus('Sınıf isimleri ve ders lejantı ayrıştırılıyor...');
    }, 3800);

    try {
      const res = await fetch('/api/gemini/parse-schedule-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ders programı yapay zeka tarafından analiz edilemedi.');
      }

      const data: ParsedScheduleResponse = await res.json();

      if (!data || !data.lessons || data.lessons.length === 0) {
        throw new Error('Görselde haftalık ders programı tablosu tespit edilemedi. Lütfen fotoğrafın net ve tam çıktığından emin olup tekrar deneyin.');
      }

      // CLASS-BASED COLOR ASSIGNMENT:
      // Assign distinct colors to each unique class first, and separate colors for different subjects of the same class
      const initialColors: Record<string, string> = {};
      const classBaseColorMap = new Map<string, string>();
      let colorPaletteIdx = 0;

      // First, get all unique class names
      const uniqueClasses = Array.from(new Set(data.lessons.map((l) => (l.className || 'Ders').trim())));
      uniqueClasses.forEach((cls) => {
        const assignedColor = DISTINCT_CLASS_COLORS[colorPaletteIdx % DISTINCT_CLASS_COLORS.length];
        classBaseColorMap.set(cls, assignedColor);
        colorPaletteIdx++;
      });

      // Now map each class + subject group
      const classSubjectCounts = new Map<string, number>();
      data.lessons.forEach((l) => {
        const key = getLessonGroupKey(l);
        const cls = (l.className || 'Ders').trim();

        if (!initialColors[key]) {
          const count = classSubjectCounts.get(cls) || 0;
          if (count === 0) {
            // First subject of this class gets the class base color
            initialColors[key] = classBaseColorMap.get(cls) || DISTINCT_CLASS_COLORS[colorPaletteIdx % DISTINCT_CLASS_COLORS.length];
          } else {
            // Subsequent subjects of this class (e.g. 12/A REH vs 12/A MAT4) get another distinct color
            initialColors[key] = DISTINCT_CLASS_COLORS[colorPaletteIdx % DISTINCT_CLASS_COLORS.length];
            colorPaletteIdx++;
          }
          classSubjectCounts.set(cls, count + 1);
        }
      });

      setParsedData(data);
      setGroupColors(initialColors);
      setUserConfirmedOverwrite(existingLessonsCount === 0);
      setStep('review');
    } catch (err: any) {
      console.error('Schedule Parse Error:', err);
      setAnalysisError(err.message || 'Analiz sırasında bir hata oluştu.');
      setStep('upload');
    }
  };

  // Change color for a specific class/subject group
  const handleChangeGroupColor = (groupKey: string, newColor: string) => {
    setGroupColors((prev) => ({
      ...prev,
      [groupKey]: newColor,
    }));
    setActiveColorPickerKey(null);
  };

  // Apply parsed schedule to the system
  const handleFinalConfirm = () => {
    if (!parsedData || !parsedData.lessons) return;

    if (existingLessonsCount > 0 && !userConfirmedOverwrite) {
      alert('Lütfen mevcut programınızın üzerine yazılacağını onaylayan kutucuğu işaretleyin.');
      return;
    }

    // Determine period times
    const detectedPeriodTimes = parsedData.periodTimes && parsedData.periodTimes.length > 0
      ? parsedData.periodTimes
      : currentConfig.periodTimes;

    const detectedPeriodsCount = parsedData.periodsPerDay || detectedPeriodTimes.length || currentConfig.periodsPerDay;
    const firstLessonTime = detectedPeriodTimes[0]?.startTime || currentConfig.firstLessonStartTime || '08:40';

    // Collect active days present in the lessons
    const activeDaysSet = new Set<ScheduleDay>(['Pzt', 'Sal', 'Çar', 'Per', 'Cum']);
    parsedData.lessons.forEach((l) => {
      if (l.day) activeDaysSet.add(l.day);
    });

    // Detect lunch break (e.g. after period 5, 50 minutes)
    const detectedLunch = detectLunchBreakFromPeriodTimes(detectedPeriodTimes);
    const lunchBreakAfter = parsedData.lunchBreakAfterPeriod || detectedLunch.lunchBreakAfterPeriod || currentConfig.lunchBreakAfterPeriod;
    const lunchBreakMins = parsedData.lunchBreakMinutes || detectedLunch.lunchBreakMinutes || currentConfig.lunchBreakMinutes;

    const newConfig: ScheduleConfig = {
      ...currentConfig,
      periodsPerDay: detectedPeriodsCount,
      firstLessonStartTime: firstLessonTime,
      activeDays: Array.from(activeDaysSet) as ScheduleDay[],
      periodTimes: detectedPeriodTimes,
      lunchBreakAfterPeriod: lunchBreakAfter,
      lunchBreakMinutes: lunchBreakMins,
    };

    // Build final lessons with class-based colors and clean/raw short names
    const finalLessons: ScheduleLesson[] = parsedData.lessons.map((l, index) => {
      const groupKey = getLessonGroupKey(l);
      const color = groupColors[groupKey] || l.color || '#3B82F6';
      const pTime = detectedPeriodTimes.find((p) => p.period === l.period);

      // Short name resolution based on user toggle:
      // If stripCodesFromShortName is true -> use clean class name (e.g. "12/C", "11/A")
      // If stripCodesFromShortName is false -> use code format (e.g. "12/C MAT4", "11/A SMAT")
      let computedShortName = l.shortName;
      if (stripCodesFromShortName) {
        computedShortName = l.cleanShortName || l.className || l.shortName || 'Ders';
      } else {
        computedShortName = l.shortName || (l.className && l.subjectCode ? `${l.className} ${l.subjectCode}` : (l.className || 'Ders'));
      }

      const computedTitle = l.title || (l.className ? `${l.className} ${l.subjectName || l.subjectCode || ''}`.trim() : (l.subjectName || l.subjectCode || 'Ders'));

      // Automatically match with registered classes in user's account (e.g. 9/C, 9-C, 9C Matematik)
      const matchedClass = findMatchingClass(
        {
          title: computedTitle,
          shortName: computedShortName,
          className: l.className,
          subject: l.subjectName || l.subjectCode,
        },
        classes
      );

      return {
        id: 'sch-ai-' + Date.now() + '-' + index + '-' + Math.random().toString(36).substring(2, 5),
        day: l.day,
        period: l.period,
        title: computedTitle,
        shortName: computedShortName,
        color: color,
        startTime: l.startTime || pTime?.startTime,
        endTime: l.endTime || pTime?.endTime,
        subject: l.subjectName || l.subjectCode,
        className: l.className,
        classId: matchedClass ? matchedClass.id : undefined,
      };
    });

    const auditInfo = `Fotoğraftan AI ile ${finalLessons.length} derslik haftalık program yüklendi. (Okul: ${parsedData.schoolName || 'Belirtilmedi'}, Öğretmen: ${parsedData.teacherName || 'Belirtilmedi'}, Öğle Arası: ${lunchBreakAfter ? `${lunchBreakAfter}. dersten sonra ${lunchBreakMins} dk` : 'Belirlenmedi'})`;

    onApplySchedule(finalLessons, newConfig, auditInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Yapay Zeka ile Fotoğraftan Program Yükle
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Otomatik Analiz
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                Haftalık öğretmen ders çizelgenizi yükleyin; saatler, sınıflar, öğle arası ve renkler otomatik ayarlansın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* STEP 1: Upload Image */}
          {step === 'upload' && (
            <div className="space-y-4">
              
              {/* Error Message */}
              {analysisError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-rose-900">Analiz Başarısız Oldu</div>
                    <div>{analysisError}</div>
                  </div>
                </div>
              )}

              {/* Warning if already has schedule */}
              {existingLessonsCount > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-amber-950">Mevcut Program Üzerine Yazılacak: </span>
                    Hesabınızda kayıtlı <b className="text-amber-950 font-black">{existingLessonsCount} ders</b> bulunmaktadır. Yeni program içe aktarıldığında eski dersleriniz silinerek yeni program ile güncellenecektir.
                  </div>
                </div>
              )}

              {/* Drag and Drop Zone */}
              {!imagePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800">
                      Ders Programı Fotoğrafını Buraya Sürükleyin veya Seçin
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      MEB e-Okul veya okul idaresi tarafından verilen haftalık öğretmen ders çizelgesi fotoğrafı (.jpg, .png)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Dosya / Fotoğraf Seç
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md max-h-64 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Ders Programı"
                      className="max-h-64 object-contain w-full"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageBase64(null);
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold rounded-xl backdrop-blur-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Farklı Fotoğraf Seç
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Fotoğraf hazırlandı. Analize başlayabilirsiniz.
                    </div>
                    <button
                      onClick={handleStartAnalysis}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Yapay Zeka ile Analiz Et
                    </button>
                  </div>
                </div>
              )}

              {/* Supported formats & tips */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  Otomatik Algılanan Özellikler
                </div>
                <ul className="text-xs text-slate-500 space-y-1.5 pl-4 list-disc">
                  <li><b>Öğle Arası Tespiti:</b> Ders saatleri arasındaki en uzun süre (örn: 5. ders 12:40 bitiş, 6. ders 13:30 başlangıç $\rightarrow$ 50 dk) otomatik olarak öğle arası olarak tanımlanır.</li>
                  <li><b>Sınıf Bazlı Renkler:</b> Her sınıfa (12/C, 12/E, 9/C, 11/A, 12/A) birbirinden ayırt edici özel renkler tanımlanır.</li>
                  <li><b>Kısaltma Sadeleştirme:</b> İsteğe göre "12/C MAT4" yerine sadece "12/C" sınıf adını gösterme seçeneği sunulur.</li>
                </ul>
              </div>

            </div>
          )}

          {/* STEP 2: Analyzing Loading State */}
          {step === 'analyzing' && (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-3xl bg-indigo-900 text-white flex items-center justify-center shadow-xl border border-indigo-700">
                  <Sparkles className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-800">Ders Programınız Analiz Ediliyor</h3>
                <p className="text-xs text-indigo-600 font-bold mt-1.5 animate-pulse">
                  {analyzingStatus}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Gemini yapay zeka modeli ders saatlerini, öğle arasını ve sınıfları çizelgeden ayrıştırıyor...
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Customization */}
          {step === 'review' && parsedData && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Header Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800">
                      {parsedData.schoolName || 'Haftalık Öğretmen Programı'}
                    </span>
                  </div>
                  {parsedData.teacherName && (
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-600" />
                      {parsedData.teacherName}
                    </span>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold">Toplam Ders</div>
                    <div className="text-xs font-black text-slate-800 mt-0.5">
                      {parsedData.lessons?.length || 0} Saat / Hafta
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold">Günlük Ders Saati</div>
                    <div className="text-xs font-black text-slate-800 mt-0.5">
                      {parsedData.periodsPerDay || parsedData.periodTimes?.length || 8} Saat
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold">İlk Ders Saati</div>
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {parsedData.periodTimes?.[0]?.startTime || '08:40'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold">Sınıf Rehberliği</div>
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3 h-3 text-indigo-500" />
                      {parsedData.mentorship || '-'}
                    </div>
                  </div>
                </div>

                {/* Lunch Break Banner */}
                {lunchBreakInfo.lunchBreakAfterPeriod && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-300/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-700">
                        <Coffee className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div>
                        <span className="font-black text-amber-950">Öğle Arası Otomatik Algılandı: </span>
                        <span className="text-amber-900 font-medium">
                          <b>{lunchBreakInfo.lunchBreakAfterPeriod}. dersten sonra</b> ({lunchBreakInfo.lunchBreakMinutes || 50} Dakika)
                          {lunchBreakInfo.startPeriodTime && lunchBreakInfo.endPeriodTime && (
                            <span className="ml-1 text-[11px] font-bold text-amber-800">
                              [{lunchBreakInfo.startPeriodTime.endTime} - {lunchBreakInfo.endPeriodTime.startTime}]
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-800 rounded-md text-[10px] font-black shrink-0">
                      Aktif
                    </span>
                  </div>
                )}

                {parsedData.dutyInfo && (
                  <div className="text-[11px] text-slate-600 font-medium bg-white p-2 rounded-xl border border-slate-200">
                    <b>Nöbet Bilgisi:</b> {parsedData.dutyInfo}
                  </div>
                )}
              </div>

              {/* USER PREFERENCE TOGGLE: Strip codes (MAT4, TSOS, SMAT) vs Keep */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      Ders Kodlarını (MAT4, SMAT vb.) Kısaltmadan Kaldır
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {stripCodesFromShortName ? (
                        <span className="text-indigo-900 font-bold">
                          ✓ Sade Görünüm: Kutularda sadece sınıf adı (<span className="text-indigo-700">"12/C", "11/A", "9/C"</span>) görünecek.
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          Kodlu Görünüm: Kutularda ders kodlarıyla birlikte (<span className="font-bold">"12/C MAT4", "11/A SMAT"</span>) görünecek.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={stripCodesFromShortName}
                    onChange={(e) => setStripCodesFromShortName(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* CLASS & SUBJECT COLOR CUSTOMIZATION */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    Sınıf ve Ders Renkleri (Ayırt Edici Renklendirme)
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Her sınıfa ayırt edici renk atandı. İsteğe göre değiştirebilirsiniz.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uniqueClassGroups.map((group) => {
                    const color = groupColors[group.key] || '#3B82F6';
                    const isPickerOpen = activeColorPickerKey === group.key;

                    return (
                      <div
                        key={group.key}
                        className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Color Swatch Button */}
                            <button
                              onClick={() => setActiveColorPickerKey(isPickerOpen ? null : group.key)}
                              className="w-8 h-8 rounded-xl shadow-xs border border-black/10 shrink-0 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                              style={{ backgroundColor: color }}
                              title="Rengi Değiştir"
                            >
                              <Palette className="w-4 h-4 text-white drop-shadow-xs" />
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  {group.className}
                                </span>
                                {group.subjectCode && (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    ({group.subjectCode})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                                {group.subjectName} • <b className="text-indigo-900 font-bold">{group.weeklyHours} Saat</b>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveColorPickerKey(isPickerOpen ? null : group.key)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg cursor-pointer shrink-0"
                          >
                            Renk Seç
                          </button>
                        </div>

                        {/* Color Picker Dropdown Palette */}
                        {isPickerOpen && (
                          <div className="pt-2 border-t border-slate-100 grid grid-cols-7 gap-1.5 animate-in fade-in">
                            {COLOR_PALETTE.map((pal) => (
                              <button
                                key={pal.value}
                                onClick={() => handleChangeGroupColor(group.key, pal.value)}
                                className={`h-6 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                                  color === pal.value ? 'ring-2 ring-indigo-900 ring-offset-1 scale-105' : ''
                                }`}
                                style={{ backgroundColor: pal.value }}
                                title={pal.name}
                              >
                                {color === pal.value && <Check className="w-3 h-3 text-white" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mini Table Preview */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Haftalık Yerleşim Önizlemesi ({parsedData.lessons?.length || 0} Ders)
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Öğle arası ve renkler tabloya yansıtıldı
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white p-2 shadow-2xs">
                  <table className="w-full text-center border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70">
                        <th className="p-1.5 text-slate-400 font-bold w-12">Saat</th>
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map((d) => (
                          <th key={d} className="p-1.5 font-black text-slate-700">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: parsedData.periodsPerDay || 8 }).map((_, pIdx) => {
                        const periodNum = pIdx + 1;
                        const pTime = parsedData.periodTimes?.find((p) => p.period === periodNum);
                        const isLunchBreakRow = lunchBreakInfo.lunchBreakAfterPeriod === periodNum;

                        return (
                          <React.Fragment key={periodNum}>
                            <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30">
                              <td className="p-1 font-bold text-slate-400 bg-slate-50/50">
                                <div>{periodNum}.</div>
                                {pTime && (
                                  <div className="text-[8px] text-slate-400 font-normal">{pTime.startTime}</div>
                                )}
                              </td>
                              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map((day) => {
                                const lesson = parsedData.lessons?.find(
                                  (l) => l.day === day && l.period === periodNum
                                );

                                if (!lesson) {
                                  return (
                                    <td key={day} className="p-1">
                                      <div className="h-7 rounded-lg border border-dashed border-slate-100" />
                                    </td>
                                  );
                                }

                                const groupKey = getLessonGroupKey(lesson);
                                const color = groupColors[groupKey] || '#3B82F6';

                                const shortDisplay = stripCodesFromShortName 
                                  ? (lesson.cleanShortName || lesson.className || lesson.shortName)
                                  : (lesson.shortName || `${lesson.className || ''} ${lesson.subjectCode || ''}`.trim());

                                return (
                                  <td key={day} className="p-1">
                                    <div
                                      className="h-7 rounded-lg text-white font-black flex flex-col items-center justify-center px-1 shadow-2xs leading-tight transition-all"
                                      style={{ backgroundColor: color }}
                                      title={`${lesson.title || ''} (${lesson.day} ${lesson.period}. Ders)`}
                                    >
                                      <span className="text-[10px] tracking-tight">{shortDisplay}</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Lunch break row divider */}
                            {isLunchBreakRow && (
                              <tr className="bg-amber-500/10 border-y border-amber-300/80">
                                <td colSpan={6} className="py-1 px-2 text-center">
                                  <span className="text-[9px] font-black text-amber-900 flex items-center justify-center gap-1">
                                    <Coffee className="w-3 h-3 text-amber-700" />
                                    ÖĞLE ARASI ({lunchBreakInfo.lunchBreakMinutes || 50} Dakika - {lunchBreakInfo.startPeriodTime?.endTime || '12:40'} / {lunchBreakInfo.endPeriodTime?.startTime || '13:30'})
                                  </span>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overwrite Confirmation Checkbox */}
              {existingLessonsCount > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5">
                  <input
                    id="confirm-overwrite"
                    type="checkbox"
                    checked={userConfirmedOverwrite}
                    onChange={(e) => setUserConfirmedOverwrite(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="confirm-overwrite" className="text-xs text-rose-900 font-semibold cursor-pointer">
                    Mevcut <b className="font-black text-rose-950">{existingLessonsCount} dersimin silinerek</b> fotoğraftaki bu yeni program ile değiştirilmesini onaylıyorum.
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Geri / Yeniden Yükle
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  disabled={existingLessonsCount > 0 && !userConfirmedOverwrite}
                  className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    existingLessonsCount > 0 && !userConfirmedOverwrite ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Programı Sisteme Aktar
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
