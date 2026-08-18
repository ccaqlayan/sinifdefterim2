import React, { useState } from 'react';
import { AcademicYearConfig, ActiveTermSelection, PerformanceLog, Quiz, QuizScore, Homework, NotebookControl, AnnualPlanItem } from '../types';
import { getPresetDatesForAcademicYear, isDateInTerm } from '../utils/termUtils';
import { AnnualPlanSettingsBox } from './AnnualPlanSettingsBox';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Check,
  X,
  RotateCcw,
  BookOpen,
  Info,
  Award,
  Zap,
  FileSpreadsheet
} from 'lucide-react';

interface AcademicYearSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AcademicYearConfig;
  onSaveConfig: (updatedConfig: AcademicYearConfig) => void;
  // Raw records to display live matching stats
  plusMinusLogs?: PerformanceLog[];
  quizzes?: QuizScore[];
  homeworks?: Homework[];
  notebookControls?: NotebookControl[];
  annualPlanItems?: AnnualPlanItem[];
  onSaveAnnualPlanItems?: (items: AnnualPlanItem[]) => void;
  userId?: string;
}

export const AcademicYearSettingsModal: React.FC<AcademicYearSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  plusMinusLogs = [],
  quizzes = [],
  homeworks = [],
  notebookControls = [],
  annualPlanItems = [],
  onSaveAnnualPlanItems,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<'term' | 'annualPlan'>('term');
  const [academicYear, setAcademicYear] = useState<string>(config.academicYear || '2025-2026');
  const [activeTermId, setActiveTermId] = useState<ActiveTermSelection>(config.activeTermId || 'term2');

  const [term1Name, setTerm1Name] = useState<string>(config.term1?.name || '1. Dönem');
  const [term1Start, setTerm1Start] = useState<string>(config.term1?.startDate || '2025-09-08');
  const [term1End, setTerm1End] = useState<string>(config.term1?.endDate || '2026-01-16');

  const [term2Name, setTerm2Name] = useState<string>(config.term2?.name || '2. Dönem');
  const [term2Start, setTerm2Start] = useState<string>(config.term2?.startDate || '2026-02-02');
  const [term2End, setTerm2End] = useState<string>(config.term2?.endDate || '2026-06-19');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate live matching stats based on the edited dates
  const countMatchingRecords = (startDate: string, endDate: string) => {
    const pmCount = plusMinusLogs.filter((l) => l.date >= startDate && l.date <= endDate).length;
    const qzCount = quizzes.filter((q) => q.date >= startDate && q.date <= endDate).length;
    const hwCount = homeworks.filter(
      (h) => (h.dueDate >= startDate && h.dueDate <= endDate) || (h.assignedDate >= startDate && h.assignedDate <= endDate)
    ).length;
    const nbCount = notebookControls.filter((n) => n.date >= startDate && n.date <= endDate).length;
    return {
      total: pmCount + qzCount + hwCount + nbCount,
      plusMinus: pmCount,
      quiz: qzCount,
      homework: hwCount,
      notebook: nbCount,
    };
  };

  const term1Stats = countMatchingRecords(term1Start, term1End);
  const term2Stats = countMatchingRecords(term2Start, term2End);

  // Apply official MEB calendar preset
  const handleApplyPreset = (year: string) => {
    setAcademicYear(year);
    const presets = getPresetDatesForAcademicYear(year);
    setTerm1Name(presets.term1.name);
    setTerm1Start(presets.term1.startDate);
    setTerm1End(presets.term1.endDate);
    setTerm2Name(presets.term2.name);
    setTerm2Start(presets.term2.startDate);
    setTerm2End(presets.term2.endDate);

    showToast(`MEB ${year} Standart Çalışma Takvimi tarihleri yüklendi.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    // Validate dates
    if (!term1Start || !term1End || !term2Start || !term2End) {
      alert('Lütfen tüm dönem başlangıç ve bitiş tarihlerini eksiksiz giriniz.');
      return;
    }
    if (term1Start > term1End) {
      alert('1. Dönem başlangıç tarihi bitiş tarihinden sonra olamaz.');
      return;
    }
    if (term2Start > term2End) {
      alert('2. Dönem başlangıç tarihi bitiş tarihinden sonra olamaz.');
      return;
    }

    const updated: AcademicYearConfig = {
      academicYear: academicYear.trim() || '2025-2026',
      activeTermId,
      term1: {
        name: term1Name.trim() || '1. Dönem',
        startDate: term1Start,
        endDate: term1End,
      },
      term2: {
        name: term2Name.trim() || '2. Dönem',
        startDate: term2Start,
        endDate: term2End,
      },
    };

    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 w-screen h-screen flex flex-col overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between shrink-0 relative gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
              {activeTab === 'term' ? <Calendar className="w-5 h-5 text-amber-300" /> : <FileSpreadsheet className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Akademik Ayarlar & Yıllık Ders Planları</h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Yapay Zeka Destekli
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium">
                Çalışma dönemi takvimi ve sınıfların Excel yıllık ders planı entegrasyonu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Modal Tabs */}
            <div className="flex items-center p-1 bg-black/20 rounded-2xl border border-white/10 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('term')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'term' ? 'bg-white text-indigo-950 shadow-xs' : 'text-indigo-200 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Çalışma Takvimi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('annualPlan')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'annualPlan' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-indigo-200 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Yıllık Plan Yükle / Düzenle</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 flex-1">
          {activeTab === 'annualPlan' ? (
            <AnnualPlanSettingsBox
              annualPlanItems={annualPlanItems}
              onSavePlanItems={(items) => {
                if (onSaveAnnualPlanItems) {
                  onSaveAnnualPlanItems(items);
                }
              }}
              userId={userId}
            />
          ) : (
            <>
          {/* Toast Message */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Academic Year Selection & Quick MEB Presets */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Eğitim - Öğretim Yılı:
                </label>
                <p className="text-[11px] text-slate-500">Mevcut okul eğitim-öğretim yılını belirleyin</p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                  className="w-28 text-xs font-extrabold px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hızlı MEB Takvimi:
              </span>
              {['2024-2025', '2025-2026', '2026-2027'].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleApplyPreset(year)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                    academicYear === year
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Active Working Term Selection Cards */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Genel Aktif Çalışma Dönemi:
            </label>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Sistemde yeni veri girerken ve ana sayfa özetlerinde varsayılan olarak görüntülenecek dönem:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: 1. Dönem */}
              <button
                type="button"
                onClick={() => setActiveTermId('term1')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  activeTermId === 'term1'
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">1. Dönem</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      activeTermId === 'term1' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {activeTermId === 'term1' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Güz / Kış Dönemi</p>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded mt-2 inline-block">
                  {term1Stats.total} Kayıt
                </span>
              </button>

              {/* Option 2: 2. Dönem */}
              <button
                type="button"
                onClick={() => setActiveTermId('term2')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  activeTermId === 'term2'
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">2. Dönem</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      activeTermId === 'term2' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {activeTermId === 'term2' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Bahar / Yaz Dönemi</p>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded mt-2 inline-block">
                  {term2Stats.total} Kayıt
                </span>
              </button>

              {/* Option 3: Tüm Yıl */}
              <button
                type="button"
                onClick={() => setActiveTermId('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  activeTermId === 'all'
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Tüm Yıl</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      activeTermId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {activeTermId === 'all' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tüm Eğitim Yılı</p>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-2 inline-block">
                  Toplam {term1Stats.total + term2Stats.total} Kayıt
                </span>
              </button>
            </div>
          </div>

          {/* Date Range Editors for 1. and 2. Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Dönem Card */}
            <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <span className="text-xs font-black text-indigo-950">1. Dönem Tarih Aralığı</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {term1Stats.total} Kayıt
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Dönem Adı:</label>
                <input
                  type="text"
                  value={term1Name}
                  onChange={(e) => setTerm1Name(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Başlangıç:</label>
                  <input
                    type="date"
                    value={term1Start}
                    onChange={(e) => setTerm1Start(e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Bitiş:</label>
                  <input
                    type="date"
                    value={term1End}
                    onChange={(e) => setTerm1End(e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 text-[10px] text-slate-600 space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span>Derse Katılım (+/-):</span>
                  <span className="font-bold text-indigo-700">{term1Stats.plusMinus}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Quiz / Sınavlar:</span>
                  <span className="font-bold text-indigo-700">{term1Stats.quiz}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Ödev / Defter Kontrolü:</span>
                  <span className="font-bold text-indigo-700">{term1Stats.homework + term1Stats.notebook}</span>
                </div>
              </div>
            </div>

            {/* 2. Dönem Card */}
            <div className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <span className="text-xs font-black text-emerald-950">2. Dönem Tarih Aralığı</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {term2Stats.total} Kayıt
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Dönem Adı:</label>
                <input
                  type="text"
                  value={term2Name}
                  onChange={(e) => setTerm2Name(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Başlangıç:</label>
                  <input
                    type="date"
                    value={term2Start}
                    onChange={(e) => setTerm2Start(e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Bitiş:</label>
                  <input
                    type="date"
                    value={term2End}
                    onChange={(e) => setTerm2End(e.target.value)}
                    className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-[10px] text-slate-600 space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span>Derse Katılım (+/-):</span>
                  <span className="font-bold text-emerald-700">{term2Stats.plusMinus}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Quiz / Sınavlar:</span>
                  <span className="font-bold text-emerald-700">{term2Stats.quiz}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Ödev / Defter Kontrolü:</span>
                  <span className="font-bold text-emerald-700">{term2Stats.homework + term2Stats.notebook}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User-Friendly System Guidance Note */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold">Akıllı Tarih Eşleştirme Sistemi Nasıl Çalışır?</p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Girdiğiniz her artı/eksi katılım, quiz, ödev ve defter kontrolü tarihiyle birlikte saklanır. Raporlar sayfasında veya ana sayfada <strong>1. Dönem</strong> veya <strong>2. Dönem</strong> seçtiğinizde, sistem yalnızca bu tarih aralığına denk gelen kayıtları dikkate alır ve bağımsız dönem karne puanı hesaplar. Verileriniz birbirine asla karışmaz.
              </p>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Ayarları Kaydet ve Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
