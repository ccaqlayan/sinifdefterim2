import React, { useState, useMemo } from 'react';
import { AnnualPlanItem } from '../types';
import { getCurrentAcademicWeek } from '../utils/termUtils';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Edit2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Save,
  FileSpreadsheet,
  Copy,
  Monitor,
  RotateCcw,
  Upload,
  BookMarked,
  Check
} from 'lucide-react';

interface AnnualPlanDetailViewProps {
  grade?: string; // e.g. "9", "10"
  classNameTitle?: string; // e.g. "9-A"
  currentWeek?: number; // 1 to 36
  planItems: AnnualPlanItem[];
  onUpdatePlanItem?: (updatedItem: AnnualPlanItem) => void;
  onOpenAcademicSettings?: () => void;
  onBackToDashboard?: () => void;
}

export const AnnualPlanDetailView: React.FC<AnnualPlanDetailViewProps> = ({
  grade = '9',
  classNameTitle,
  currentWeek,
  planItems = [],
  onUpdatePlanItem,
  onOpenAcademicSettings,
  onBackToDashboard,
}) => {
  const dynamicCurrentWeek = useMemo(() => currentWeek || getCurrentAcademicWeek(), [currentWeek]);

  // Clean initial grade string to digits (e.g. "9-A" -> "9"). Default to '9' if < 9 or empty
  const initialGradeClean = useMemo(() => {
    const extracted = grade ? grade.replace(/\D/g, '') : '';
    const num = parseInt(extracted, 10);
    if (!num || num < 9 || num > 12) return '9';
    return String(num);
  }, [grade]);

  const [activeGrade, setActiveGrade] = useState<string>(initialGradeClean);
  const [activeWeek, setActiveWeek] = useState<number>(dynamicCurrentWeek);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSmartBoardMode, setIsSmartBoardMode] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // ONLY High School Grade Levels (5, 6, 7, 8 are excluded per user requirement)
  const availableGradeLevels = ['9', '10', '11', '12'];

  // Filter items for active grade
  const gradeItems = useMemo(() => {
    return planItems.filter((i) => {
      const cleanG = i.grade.replace(/\D/g, '');
      return cleanG === activeGrade || i.grade === activeGrade || i.grade === `${activeGrade}. Sınıf`;
    });
  }, [planItems, activeGrade]);

  const currentPlanItem = gradeItems.find((i) => i.week === activeWeek);

  // Edit State
  const [editTheme, setEditTheme] = useState<string>(currentPlanItem?.theme || '');
  const [editTopic, setEditTopic] = useState<string>(currentPlanItem?.topic || '');
  const [editOutcome, setEditOutcome] = useState<string>(currentPlanItem?.outcome || '');
  const [editDesc, setEditDesc] = useState<string>(currentPlanItem?.description || '');

  const handleStartEdit = () => {
    if (currentPlanItem) {
      setEditTheme(currentPlanItem.theme);
      setEditTopic(currentPlanItem.topic);
      setEditOutcome(currentPlanItem.outcome);
      setEditDesc(currentPlanItem.description || '');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (!currentPlanItem) return;
    const updated: AnnualPlanItem = {
      ...currentPlanItem,
      theme: editTheme,
      topic: editTopic,
      outcome: editOutcome,
      description: editDesc,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdatePlanItem) {
      onUpdatePlanItem(updated);
    }
    setIsEditing(false);
  };

  // Copy text for student notebooks or whiteboard
  const handleCopyNotebookText = () => {
    if (!currentPlanItem) return;
    const text =
      `📝 [${activeGrade}. SINIF - ${activeWeek}. HAFTA DEFTERE YAZILACAK BİLGİLER]\n\n` +
      `📚 Tema/Ünite: ${currentPlanItem.theme || '-'}\n` +
      `📌 Ders Konusu: ${currentPlanItem.topic || '-'}\n` +
      `🎯 Öğrenme Çıktısı/Kazanım: ${currentPlanItem.outcome || '-'}\n` +
      (currentPlanItem.dateRange ? `📅 Tarih Aralığı: ${currentPlanItem.dateRange}\n` : '') +
      (currentPlanItem.description ? `💡 Açıklama/Not: ${currentPlanItem.description}` : '');

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Full Page Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-4 sm:p-6 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer shrink-0 border border-white/10 active:scale-95"
              title="Ana Sayfaya Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-amber-400/20 border border-purple-400/30 flex items-center justify-center text-amber-300 font-black shrink-0 shadow-inner">
            <BookMarked className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Kazanımlar & Defter Bilgileri
              </h2>
              {classNameTitle && (
                <span className="bg-indigo-500/40 text-amber-300 text-xs font-extrabold px-3 py-0.5 rounded-full border border-indigo-400/30">
                  {classNameTitle}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              Deftere bu hafta yazılması gereken tema, konu ve MEB öğretim çıktıları
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {onOpenAcademicSettings && (
            <button
              type="button"
              onClick={onOpenAcademicSettings}
              className="p-2 sm:px-3.5 sm:py-2 bg-white/10 hover:bg-white/20 text-amber-300 font-extrabold text-xs rounded-2xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Yıllık Plan Yükle"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Yıllık Plan Yükle</span>
            </button>
          )}
        </div>
      </div>

      {/* Grade Level Selection Tabs (ONLY High School 9, 10, 11, 12) */}
      <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider px-1 sm:px-2 shrink-0">
            Sınıf Seviyesi:
          </span>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {availableGradeLevels.map((g) => {
              const isSelected = activeGrade === g;
              const hasItems = planItems.some(
                (item) => item.grade.replace(/\D/g, '') === g || item.grade === g || item.grade === `${g}. Sınıf`
              );

              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setActiveGrade(g);
                    setIsEditing(false);
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-lg scale-102 font-black'
                      : hasItems
                      ? 'bg-white/10 hover:bg-white/20 text-indigo-100'
                      : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>{g}. Sınıf</span>
                  {hasItems && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSelected ? 'bg-slate-950' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Week Navigation Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            type="button"
            disabled={activeWeek <= 1}
            onClick={() => {
              setActiveWeek((w) => Math.max(1, w - 1));
              setIsEditing(false);
            }}
            className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-40 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            title="Önceki Hafta"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Week Selector Dropdown */}
          <div className="relative flex-1 min-w-0">
            <select
              value={activeWeek}
              onChange={(e) => {
                setActiveWeek(Number(e.target.value));
                setIsEditing(false);
              }}
              className="w-full bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs sm:text-sm font-black rounded-xl px-2.5 sm:px-3.5 py-2 cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs pr-7 truncate"
            >
              {Array.from({ length: 36 }, (_, i) => i + 1).map((w) => {
                const itemForWeek = gradeItems.find((item) => item.week === w);
                return (
                  <option key={w} value={w}>
                    {w}. Hafta {w === dynamicCurrentWeek ? '🎯 (Güncel)' : ''}{' '}
                    {itemForWeek ? ` - ${itemForWeek.topic.slice(0, 30)}...` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            disabled={activeWeek >= 36}
            onClick={() => {
              setActiveWeek((w) => Math.min(36, w + 1));
              setIsEditing(false);
            }}
            className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-40 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            title="Sonraki Hafta"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end sm:justify-start gap-2 shrink-0">
          {activeWeek === dynamicCurrentWeek ? (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs leading-snug">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="flex flex-col sm:flex-row sm:gap-1 text-left">
                <span>Güncel Ders Haftası</span>
                <span className="text-[11px] font-extrabold text-emerald-700 sm:text-xs sm:font-black">({dynamicCurrentWeek}. Hafta)</span>
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setActiveWeek(dynamicCurrentWeek)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-extrabold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 cursor-pointer transition-all leading-snug"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="flex flex-col sm:flex-row sm:gap-1 text-left">
                <span>Güncel Haftaya Git</span>
                <span className="text-[11px] font-extrabold text-indigo-600 sm:text-xs sm:font-extrabold">({dynamicCurrentWeek}. Hafta)</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {copiedToast && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check className="w-5 h-5 text-amber-300 shrink-0" />
          <span>Deftere yazılacak bilgiler panoya kopyalandı! Dilediğiniz yere yapıştırabilirsiniz.</span>
        </div>
      )}

      {currentPlanItem ? (
        isSmartBoardMode ? (
          /* Akıllı Tahta / Projeksiyon Odak Modu */
          <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border-2 border-amber-400/50 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
                  🖥️ AKILLI TAHTA ODAK GÖRÜNÜMÜ ({activeGrade}. SINIF - {activeWeek}. HAFTA)
                </span>
                {currentPlanItem.dateRange && (
                  <p className="text-xs text-slate-400 mt-1">{currentPlanItem.dateRange}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSmartBoardMode(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-extrabold rounded-xl text-white cursor-pointer"
              >
                Normal Görünüme Dön
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">
                  ÜNİTE / TEMA
                </span>
                <p className="text-xl font-black text-slate-200 mt-1">{currentPlanItem.theme}</p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-amber-400/50 shadow-inner">
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest block">
                  DERS KONUSU (DEFTER BAŞLIĞI)
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-2 leading-snug">
                  {currentPlanItem.topic}
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-400/50">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
                  ÖĞRENME ÇIKTISI / MEB KAZANIMI
                </span>
                <p className="text-lg sm:text-xl font-bold text-emerald-200 mt-2 leading-relaxed">
                  {currentPlanItem.outcome}
                </p>
              </div>
            </div>
          </div>
        ) : !isEditing ? (
          /* Normal Full Page Card View */
          <div className="space-y-4">
            {/* Theme & Date Banner */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 p-5 rounded-2xl border border-purple-100/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black text-purple-700 uppercase tracking-wider block mb-0.5">
                  Tema / Ünite Adı
                </span>
                <h3 className="text-lg font-black text-indigo-950">{currentPlanItem.theme}</h3>
                {currentPlanItem.dateRange && (
                  <span className="text-xs font-bold text-slate-600 mt-1.5 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {currentPlanItem.dateRange}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsSmartBoardMode(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Sınıf akıllı tahtasında büyük harflerle projeksiyon görünümü aç"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Akıllı Tahta Modu</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Düzenle</span>
                </button>
              </div>
            </div>

            {/* Main Topic Card (Deftere Yazılacak Konu) */}
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Ders Konusu (Deftere Yazılacak Bilgi)
                </span>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                  {activeGrade}. Sınıf Müfredatı
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentPlanItem.topic}
              </p>
            </div>

            {/* MEB Outcome / Kazanım Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-300/80 space-y-2 shadow-2xs">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Öğrenme Çıktısı / MEB Kazanımı
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                {currentPlanItem.outcome}
              </p>
            </div>

            {/* Description & Process Components */}
            {currentPlanItem.description && (
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1.5">
                <span className="font-black text-slate-900 block">Süreç Bileşenleri, Yöntem-Teknik & Açıklamalar:</span>
                <p className="leading-relaxed">{currentPlanItem.description}</p>
              </div>
            )}
          </div>
        ) : (
          /* Edit View */
          <div className="space-y-4 text-xs sm:text-sm text-slate-800 bg-white p-5 rounded-2xl border border-slate-200 shadow-md">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-900 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {activeGrade}. Sınıf {activeWeek}. Hafta planını düzenliyorsunuz.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tema / Ünite:</label>
              <input
                type="text"
                value={editTheme}
                onChange={(e) => setEditTheme(e.target.value)}
                className="w-full font-bold px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ders Konusu:</label>
              <input
                type="text"
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
                className="w-full font-bold px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Öğrenme Çıktısı / Kazanım:</label>
              <textarea
                rows={4}
                value={editOutcome}
                onChange={(e) => setEditOutcome(e.target.value)}
                className="w-full font-medium px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white leading-relaxed focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Açıklamalar / Yöntem:</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full font-medium px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* Fallback Empty State */
        <div className="py-16 text-center text-slate-500 space-y-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 shadow-2xs">
          <FileSpreadsheet className="w-14 h-14 mx-auto text-slate-400" />
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800">
              {activeGrade}. Sınıf Seviyesi ({activeWeek}. Hafta) İçin Plan Bulunamadı
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Bu sınıf kademesi için henüz bir yıllık ders planı yüklenmemiş veya bu haftaya ait kazanım verisi bulunmuyor.
            </p>
          </div>

          {onOpenAcademicSettings && (
            <button
              type="button"
              onClick={onOpenAcademicSettings}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 mx-auto cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Yıllık Ders Planı / Excel Yükle</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
