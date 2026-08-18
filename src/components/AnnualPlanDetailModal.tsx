import React, { useState, useMemo } from 'react';
import { AnnualPlanItem } from '../types';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  X,
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

interface AnnualPlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string; // e.g. "5", "9"
  classNameTitle?: string; // e.g. "9-A"
  currentWeek: number; // 1 to 36
  planItems: AnnualPlanItem[];
  onUpdatePlanItem?: (updatedItem: AnnualPlanItem) => void;
  onOpenAcademicSettings?: () => void;
}

export const AnnualPlanDetailModal: React.FC<AnnualPlanDetailModalProps> = ({
  isOpen,
  onClose,
  grade,
  classNameTitle,
  currentWeek = 10,
  planItems = [],
  onUpdatePlanItem,
  onOpenAcademicSettings,
}) => {
  if (!isOpen) return null;

  // Clean initial grade string to digits (e.g. "9-A" -> "9")
  const initialGradeClean = useMemo(() => {
    const extracted = grade ? grade.replace(/\D/g, '') : '';
    const num = parseInt(extracted, 10);
    if (!num || num < 9 || num > 12) return '9';
    return String(num);
  }, [grade]);

  const [activeGrade, setActiveGrade] = useState<string>(initialGradeClean);
  const [activeWeek, setActiveWeek] = useState<number>(currentWeek || 10);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSmartBoardMode, setIsSmartBoardMode] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Available grade levels list - High School only (5, 6, 7, 8 excluded)
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-amber-400/20 border border-purple-400/30 flex items-center justify-center text-amber-300 font-black text-sm shadow-inner">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Kazanımlar & Defter Bilgisi
                </h3>
                {classNameTitle && (
                  <span className="bg-indigo-500/40 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                    {classNameTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Deftere bu hafta yazmanız gereken tema, konu ve MEB kazanım bilgileri.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grade Level Selection Tabs */}
        <div className="bg-slate-900/90 text-white px-4 py-2.5 border-b border-indigo-900/50 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider shrink-0">
            Sınıf Seviyesi:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
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
                  className={`px-3 py-1 rounded-xl font-extrabold text-xs shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md scale-102 font-black'
                      : hasItems
                      ? 'bg-white/10 hover:bg-white/20 text-indigo-100'
                      : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>{g}. Sınıf</span>
                  {hasItems && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-slate-950' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Week Navigation Bar */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activeWeek <= 1}
              onClick={() => {
                setActiveWeek((w) => Math.max(1, w - 1));
                setIsEditing(false);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Önceki Hafta</span>
            </button>

            {/* Week Selector Dropdown */}
            <div className="relative">
              <select
                value={activeWeek}
                onChange={(e) => {
                  setActiveWeek(Number(e.target.value));
                  setIsEditing(false);
                }}
                className="bg-white border border-slate-300 text-slate-900 text-xs font-black rounded-xl px-3 py-1.5 cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs pr-8"
              >
                {Array.from({ length: 36 }, (_, i) => i + 1).map((w) => {
                  const itemForWeek = gradeItems.find((item) => item.week === w);
                  return (
                    <option key={w} value={w}>
                      {w}. Hafta {w === currentWeek ? '🎯 (Güncel Ders)' : ''}{' '}
                      {itemForWeek ? ` - ${itemForWeek.topic.slice(0, 25)}...` : ''}
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
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <span className="hidden sm:inline">Sonraki Hafta</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeWeek === currentWeek && (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Güncel Ders Haftası
              </span>
            )}

            {activeWeek !== currentWeek && (
              <button
                type="button"
                onClick={() => setActiveWeek(currentWeek)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-xl border border-indigo-200 flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Güncel Haftaya Git ({currentWeek}. Hafta)</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {copiedToast && (
            <div className="p-3 bg-emerald-600 text-white text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg animate-in fade-in">
              <Check className="w-4 h-4 text-amber-300" />
              <span>Deftere yazılacak bilgiler panoya kopyalandı! Dilediğiniz yere yapıştırabilirsiniz.</span>
            </div>
          )}

          {currentPlanItem ? (
            isSmartBoardMode ? (
              /* Akıllı Tahta / Projeksiyon Odak Modu */
              <div className="bg-slate-950 text-white p-6 rounded-3xl border-2 border-amber-400/50 shadow-2xl space-y-5 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
                      🖥️ AKILLI TAHTA ODAK GÖRÜNÜMÜ ({activeGrade}. SINIF - {activeWeek}. HAFTA)
                    </span>
                    {currentPlanItem.dateRange && (
                      <p className="text-xs text-slate-400 mt-0.5">{currentPlanItem.dateRange}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSmartBoardMode(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-extrabold rounded-xl text-white cursor-pointer"
                  >
                    Normal Görünüme Dön
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest block">
                      ÜNİTE / TEMA
                    </span>
                    <p className="text-lg font-black text-slate-200 mt-1">{currentPlanItem.theme}</p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-amber-400/40">
                    <span className="text-[11px] font-black text-amber-300 uppercase tracking-widest block">
                      DERS KONUSU (DEFTER BAŞLIĞI)
                    </span>
                    <p className="text-2xl font-black text-amber-300 mt-1 leading-snug">
                      {currentPlanItem.topic}
                    </p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-400/40">
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block">
                      ÖĞRENME ÇIKTISI / MEB KAZANIMI
                    </span>
                    <p className="text-lg font-bold text-emerald-200 mt-1 leading-relaxed">
                      {currentPlanItem.outcome}
                    </p>
                  </div>
                </div>
              </div>
            ) : !isEditing ? (
              /* Standart Detay Görünümü */
              <div className="space-y-4">
                {/* Theme & Date Card */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 p-4 rounded-2xl border border-purple-100 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block mb-0.5">
                      Tema / Ünite Adı
                    </span>
                    <h4 className="text-base font-black text-indigo-950">{currentPlanItem.theme}</h4>
                    {currentPlanItem.dateRange && (
                      <span className="text-xs font-bold text-slate-600 mt-1 inline-flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                        <Calendar className="w-3 h-3 text-indigo-500" /> {currentPlanItem.dateRange}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSmartBoardMode(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Sınıf akıllı tahtasında büyük harflerle projeksiyon görünümü aç"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Akıllı Tahta</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                  </div>
                </div>

                {/* Topic Card (Deftere Yazılacak Konu) */}
                <div className="bg-white p-4.5 rounded-2xl border-2 border-indigo-200/90 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Ders Konusu (Deftere Yazılacak)
                    </span>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {activeGrade}. Sınıf
                    </span>
                  </div>
                  <p className="text-base font-black text-slate-900">{currentPlanItem.topic}</p>
                </div>

                {/* Outcome / Kazanım Card */}
                <div className="bg-amber-50/70 p-4.5 rounded-2xl border border-amber-300/80 space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Öğrenme Çıktısı / MEB Kazanımı
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                    {currentPlanItem.outcome}
                  </p>
                </div>

                {/* Description */}
                {currentPlanItem.description && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <span className="font-black text-slate-700 block">Süreç Bileşenleri, Yöntem & Açıklamalar:</span>
                    <p className="leading-relaxed">{currentPlanItem.description}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit View */
              <div className="space-y-3 text-xs text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-900 font-bold text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {activeGrade}. Sınıf {activeWeek}. Hafta planını güncelliyorsunuz.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tema / Ünite:</label>
                  <input
                    type="text"
                    value={editTheme}
                    onChange={(e) => setEditTheme(e.target.value)}
                    className="w-full font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ders Konusu:</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Öğrenme Çıktısı / Kazanım:</label>
                  <textarea
                    rows={4}
                    value={editOutcome}
                    onChange={(e) => setEditOutcome(e.target.value)}
                    className="w-full font-medium px-3 py-2 border border-slate-300 rounded-xl bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Açıklamalar / Yöntem:</label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full font-medium px-3 py-2 border border-slate-300 rounded-xl bg-white"
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Kaydet</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Fallback State */
            <div className="py-12 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400" />
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {activeGrade}. Sınıf Seviyesi ({activeWeek}. Hafta) İçin Plan Bulunamadı
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Bu sınıf kademesi için henüz bir yıllık ders planı yüklemediniz veya bu haftaya ait kazanım verisi girilmemiş.
                </p>
              </div>

              {onOpenAcademicSettings && (
                <button
                  type="button"
                  onClick={onOpenAcademicSettings}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Yıllık Ders Planı / Excel Yükle</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {currentPlanItem && (
              <button
                type="button"
                onClick={handleCopyNotebookText}
                className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs rounded-xl border border-purple-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Deftere yazılacak ders konusunu ve kazanımını panoya kopyala"
              >
                <Copy className="w-4 h-4 text-purple-700" />
                <span>📋 Defter Metnini Kopyala</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
