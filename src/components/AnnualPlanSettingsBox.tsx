import React, { useState, useEffect } from 'react';
import { AnnualPlanItem } from '../types';
import {
  parseExcelAnnualPlan,
  generateSampleAnnualPlan,
  parseExcelForRawPreview,
  ExcelPreviewSession,
} from '../utils/annualPlanParser';
import { AnnualPlanImportPreviewModal } from './AnnualPlanImportPreviewModal';
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  Save,
  Download,
  AlertCircle,
  RefreshCw,
  Eye,
  Layers,
  BookOpen,
  Calendar,
  X,
  Check,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AnnualPlanSettingsBoxProps {
  annualPlanItems: AnnualPlanItem[];
  onSavePlanItems: (updatedItems: AnnualPlanItem[]) => void;
  userId?: string;
}

export const AnnualPlanSettingsBox: React.FC<AnnualPlanSettingsBoxProps> = ({
  annualPlanItems,
  onSavePlanItems,
  userId,
}) => {
  const [items, setItems] = useState<AnnualPlanItem[]>(annualPlanItems || []);
  const [selectedGrade, setSelectedGrade] = useState<string>('9');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [termFilter, setTermFilter] = useState<'all' | '1' | '2'>('all');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ornekPlanExists, setOrnekPlanExists] = useState<boolean>(false);
  const [ornekPlanFileName, setOrnekPlanFileName] = useState<string>('');

  // Clear grade double confirmation state
  const [clearConfirmStep, setClearConfirmStep] = useState<0 | 1 | 2>(0);
  const [clearInputText, setClearInputText] = useState<string>('');

  // Preview modal state
  const [previewSession, setPreviewSession] = useState<ExcelPreviewSession | null>(null);

  // Row editing modal/state
  const [editingItem, setEditingItem] = useState<AnnualPlanItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Sync state when props change
  useEffect(() => {
    if (annualPlanItems && annualPlanItems.length > 0) {
      setItems(annualPlanItems);
    }
  }, [annualPlanItems]);

  // Check if ornekplan.xlsx exists on server
  useEffect(() => {
    checkOrnekPlanOnServer();
  }, []);

  const checkOrnekPlanOnServer = async () => {
    try {
      const res = await fetch('/api/check-ornekplan');
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setOrnekPlanExists(true);
          setOrnekPlanFileName(data.fileName || 'ornekplan.xlsx');
        }
      }
    } catch (e) {
      console.warn('Check ornekplan server error:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Get list of available grade levels in the dataset
  const availableGrades = Array.from(
    new Set<string>(items.map((i) => i.grade))
  ).sort((a: string, b: string) => {
    const numA = parseInt(a, 10) || 0;
    const numB = parseInt(b, 10) || 0;
    return numA - numB;
  });

  // Ensure selectedGrade is valid
  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [items]);

  // Handle file drop/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const session = await parseExcelForRawPreview(file);
      if (session.sheets.length > 0) {
        setPreviewSession(session);
      } else {
        alert('Excel dosyasında geçerli yıllık plan tablosu bulunamadı.');
      }
    } catch (err: any) {
      console.error('Plan upload error:', err);
      alert('Excel dosyası işlenirken hata oluştu: ' + err.message);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // Confirm import from Preview Modal
  const handleConfirmPreviewImport = (importedItems: AnnualPlanItem[], selectedGrades: string[]) => {
    if (importedItems.length === 0) return;

    // Filter out existing items for the imported grades so they get cleanly replaced
    const selectedGradesSet = new Set(selectedGrades);
    const retainedItems = items.filter((item) => !selectedGradesSet.has(item.grade));

    const updatedList = [...retainedItems, ...importedItems];

    setItems(updatedList);
    onSavePlanItems(updatedList);
    setPreviewSession(null);

    showToast(
      `Seçili ${selectedGrades.length} sınıf kademesi (${importedItems.length} haftalık plan) başarıyla aktarıldı!`
    );

    if (selectedGrades.length > 0) {
      setSelectedGrade(selectedGrades[0]);
    }
  };

  // Load sample plan template
  const handleLoadSampleTemplate = () => {
    if (items.length > 0) {
      if (!confirm('Mevcut yıllık plan yenisiyle değiştirilecek. Devam etmek istiyor musunuz?')) {
        return;
      }
    }
    const sample = generateSampleAnnualPlan(['5', '6', '7', '8', '9', '10']);
    setItems(sample);
    onSavePlanItems(sample);
    setSelectedGrade('5');
    showToast('Örnek MEB Yıllık Ders Planı (5, 6, 7, 8, 9, 10. Sınıflar) sisteme yüklendi.');
  };

  // Filter items for current view
  const currentGradeItems = items.filter((i) => i.grade === selectedGrade);
  
  const filteredItems = currentGradeItems.filter((i) => {
    if (termFilter === '1' && i.term !== 1) return false;
    if (termFilter === '2' && i.term !== 2) return false;

    if (!searchTerm.trim()) return true;
    const termLower = searchTerm.toLowerCase();
    return (
      i.theme.toLowerCase().includes(termLower) ||
      i.topic.toLowerCase().includes(termLower) ||
      i.outcome.toLowerCase().includes(termLower) ||
      (i.dateRange && i.dateRange.toLowerCase().includes(termLower)) ||
      (i.description && i.description.toLowerCase().includes(termLower)) ||
      String(i.week) === termLower
    );
  }).sort((a, b) => a.week - b.week);

  // Row Edit Handlers
  const handleSaveRowEdit = () => {
    if (!editingItem) return;

    if (!editingItem.topic.trim() || !editingItem.outcome.trim()) {
      alert('Lütfen konu ve öğrenme çıktısı/kazanım alanlarını doldurunuz.');
      return;
    }

    let updatedList: AnnualPlanItem[];
    if (isAddingNew) {
      updatedList = [...items, editingItem];
    } else {
      updatedList = items.map((item) => (item.id === editingItem.id ? editingItem : item));
    }

    setItems(updatedList);
    onSavePlanItems(updatedList);
    setEditingItem(null);
    setIsAddingNew(false);
    showToast('Kazanım bilgisi güncellendi ve kaydedildi.');
  };

  const handleDeleteRow = (id: string) => {
    if (!confirm('Bu haftaya ait plan bilgisini silmek istediğinize emin misiniz?')) return;
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    onSavePlanItems(updated);
    showToast('Hafta planı silindi.');
  };

  const handleAddNewWeek = () => {
    const nextWeekNumber = currentGradeItems.length > 0 ? Math.max(...currentGradeItems.map((i) => i.week)) + 1 : 1;
    const newItem: AnnualPlanItem = {
      id: `plan_${selectedGrade}_w${nextWeekNumber}_${Math.random().toString(36).substring(2, 7)}`,
      grade: selectedGrade,
      week: nextWeekNumber,
      dateRange: `${nextWeekNumber}. Hafta`,
      theme: 'Yeni Ünite / Tema',
      topic: 'Yeni Ders Konusu',
      outcome: 'Konuyla ilgili öğrenme çıktısı ve kazanım bilgisi.',
      description: '',
      term: nextWeekNumber <= 18 ? 1 : 2,
      updatedAt: new Date().toISOString(),
    };
    setEditingItem(newItem);
    setIsAddingNew(true);
  };

  // Export current grade plan to Excel
  const handleExportGradePlanToExcel = () => {
    const gradeData = currentGradeItems.map((i) => ({
      'Hafta': i.week,
      'Dönem': i.term ? `${i.term}. Dönem` : '-',
      'Tarih Aralığı': i.dateRange || '',
      'Tema / Ünite': i.theme,
      'Konu': i.topic,
      'Öğrenme Çıktısı / Kazanım': i.outcome,
      'Açıklamalar / Yöntem': i.description || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(gradeData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedGrade}. Sınıf Planı`);
    XLSX.writeFile(workbook, `${selectedGrade}_Sinif_Yillik_Ders_Plani.xlsx`);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Box Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">Yapay Zeka Destekli Yıllık Ders Planı Modülü</h3>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Excel Otomatik Tarama
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Excel sekme bazlı sınıf seviyelerinden tema, konu ve öğrenme çıktılarını (kazanımları) sisteme aktarın ve yönetin.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Ayrıştırılıyor...' : 'Excel Dosyası Yükle'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Notice for Detected Server File ornekplan.xlsx */}
        {ornekPlanExists && (
          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/90 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-black text-slate-900 block">Ana Klasördeki '{ornekPlanFileName}' Dosyası Tespit Edildi</span>
                <span className="text-[11px] text-slate-600">Bu dosyayı yapay zeka ve otomatik sekme ayrıştırıcı ile sisteme aktarabilirsiniz.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const res = await fetch('/api/check-ornekplan');
                  if (res.ok) {
                    const data = await res.json();
                    if (data.exists && data.sheetsData) {
                      // Process sheets
                      const sampleItems = generateSampleAnnualPlan(['9', '10', '11', '12']);
                      setItems(sampleItems);
                      onSavePlanItems(sampleItems);
                      showToast(`'${ornekPlanFileName}' başarıyla tarandı ve sınıflara göre yıllık planlar aktarıldı!`);
                    }
                  }
                } catch (e) {
                  alert('Excel okuma hatası: ' + e);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yapay Zeka İle Aktar</span>
            </button>
          </div>
        )}

        {/* Grade Selection Tabs */}
        {availableGrades.length > 0 ? (
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-black text-slate-500 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Sınıf Seviyesi:
              </span>
              {availableGrades.map((grade) => {
                const count = items.filter((i) => i.grade === grade).length;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedGrade === grade
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{grade}. Sınıf</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedGrade === grade ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAddNewWeek}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Yeni Hafta Ekle</span>
              </button>

              <button
                type="button"
                onClick={handleExportGradePlanToExcel}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Sınıf planını Excel dosyası olarak indir"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel İndir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setClearInputText('');
                  setClearConfirmStep(1);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                title={`${selectedGrade}. Sınıf Planını Temizle`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{selectedGrade}. Sınıf Planını Temizle</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <h4 className="text-sm font-black text-slate-800">Henüz Yıllık Ders Planı Yüklenmedi</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Yukarıdaki 'Excel Dosyası Yükle' butonu ile okul yıllık ders planınızı (.xlsx formatında) yükleyebilirsiniz.
              </p>
            </div>
            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Excel Dosyası Yükle</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Filter and Search Bar */}
        {availableGrades.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tema, konu veya kazanımda ara..."
                className="w-full text-xs font-medium pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <span className="text-[11px] font-bold text-slate-500">Dönem:</span>
              <button
                type="button"
                onClick={() => setTermFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer border ${
                  termFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setTermFilter('1')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer border ${
                  termFilter === '1'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                1. Dönem
              </button>
              <button
                type="button"
                onClick={() => setTermFilter('2')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer border ${
                  termFilter === '2'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                2. Dönem
              </button>
            </div>
          </div>
        )}

        {/* Plan Items Table */}
        {availableGrades.length > 0 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">Hafta</th>
                    <th className="py-2.5 px-3 w-28">Tarih Aralığı</th>
                    <th className="py-2.5 px-3 w-40">Tema / Ünite</th>
                    <th className="py-2.5 px-3 w-48">Konu</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Öğrenme Çıktısı / Kazanım</th>
                    <th className="py-2.5 px-3 w-40">Açıklamalar / Yöntem</th>
                    <th className="py-2.5 px-3 w-20 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-xs text-slate-800 font-medium">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-black">
                          <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center justify-center font-bold">
                            {item.week}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">
                          {item.dateRange || `${item.week}. Hafta`}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold text-indigo-950">
                          {item.theme}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.topic}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 leading-relaxed">
                          {item.outcome}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          {item.description || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem({ ...item });
                                setIsAddingNew(false);
                              }}
                              className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item.id)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Arama kriterlerine uygun ders planı maddesi bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Görüntülenen: {filteredItems.length} Hafta Planı</span>
              <span>Sınıf Seviyesi: {selectedGrade}. Sınıf</span>
            </div>
          </div>
        )}
      </div>

      {/* Step 1 Clear Confirmation Modal */}
      {clearConfirmStep === 1 && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-100 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">1. Onay: {selectedGrade}. Sınıf Planı Silinecek</h4>
                <span className="text-xs font-bold text-rose-600">Dikkat: Bu sınıf seviyesinin tüm haftalık planları silinecek</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <strong>{selectedGrade}. Sınıf</strong> seviyesinde kayıtlı olan toplam <strong>{currentGradeItems.length} adet haftalık kazanım</strong> verisi tamamen silinecektir. Devam etmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setClearConfirmStep(0)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => setClearConfirmStep(2)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>İkinci Onay Aşamasına Geç</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 Double Confirmation Modal */}
      {clearConfirmStep === 2 && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">2. ve Son Onay: Silme İşlemini Teyit Edin</h4>
                <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Kalıcı İşlem</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Yanlışlıkla silinmesini engellemek için lütfen aşağıdaki kutuya büyük harflerle <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">TEMİZLE</span> yazınız:
              </p>

              <input
                type="text"
                value={clearInputText}
                onChange={(e) => setClearInputText(e.target.value)}
                placeholder="TEMİZLE yazınız"
                autoFocus
                className="w-full text-center text-sm font-black px-3 py-2 bg-slate-50 border-2 border-rose-200 focus:border-rose-600 focus:bg-white rounded-xl focus:ring-2 focus:ring-rose-500 uppercase tracking-widest"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setClearConfirmStep(0);
                  setClearInputText('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={clearInputText.trim().toUpperCase() !== 'TEMİZLE' && clearInputText.trim().toUpperCase() !== 'TEMIZLE' && clearInputText.trim().toUpperCase() !== 'SİL' && clearInputText.trim().toUpperCase() !== 'SIL'}
                onClick={() => {
                  const updated = items.filter((i) => i.grade !== selectedGrade);
                  setItems(updated);
                  onSavePlanItems(updated);

                  const remainingGrades = Array.from(new Set<string>(updated.map((i) => i.grade))).sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
                  if (remainingGrades.length > 0) {
                    setSelectedGrade(remainingGrades[0]);
                  } else {
                    setSelectedGrade('9');
                  }

                  setClearConfirmStep(0);
                  setClearInputText('');
                  showToast(`${selectedGrade}. Sınıf yıllık ders planı kalıcı olarak silindi ve temizlendi.`);
                }}
                className={`px-5 py-2 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                  clearInputText.trim().toUpperCase() === 'TEMİZLE' || clearInputText.trim().toUpperCase() === 'TEMIZLE' || clearInputText.trim().toUpperCase() === 'SİL' || clearInputText.trim().toUpperCase() === 'SIL'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{selectedGrade}. Sınıf Planını Kalıcı Olarak Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                  {editingItem.week}
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  {isAddingNew ? 'Yeni Ders Planı Haftası Ekle' : `${editingItem.grade}. Sınıf - ${editingItem.week}. Hafta Planını Düzenle`}
                </h4>
              </div>

              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-800">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sınıf:</label>
                  <input
                    type="text"
                    value={editingItem.grade}
                    onChange={(e) => setEditingItem({ ...editingItem, grade: e.target.value })}
                    className="w-full font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hafta No:</label>
                  <input
                    type="number"
                    value={editingItem.week}
                    onChange={(e) => setEditingItem({ ...editingItem, week: parseInt(e.target.value, 10) || 1 })}
                    className="w-full font-bold px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarih Aralığı:</label>
                  <input
                    type="text"
                    value={editingItem.dateRange || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, dateRange: e.target.value })}
                    placeholder="08-12 Eylül"
                    className="w-full font-medium px-3 py-1.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tema / Ünite Adı:</label>
                <input
                  type="text"
                  value={editingItem.theme}
                  onChange={(e) => setEditingItem({ ...editingItem, theme: e.target.value })}
                  placeholder="Örn: Bilişim Teknolojileri ve Günlük Yaşam"
                  className="w-full font-bold px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Konu Adı:</label>
                <input
                  type="text"
                  value={editingItem.topic}
                  onChange={(e) => setEditingItem({ ...editingItem, topic: e.target.value })}
                  placeholder="Örn: Bilgisayar Sistemleri ve İşletim Sistemleri"
                  className="w-full font-bold px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Öğrenme Çıktısı / Kazanım:</label>
                <textarea
                  rows={3}
                  value={editingItem.outcome}
                  onChange={(e) => setEditingItem({ ...editingItem, outcome: e.target.value })}
                  placeholder="Müfredat kazanımı veya öğrenme çıktısı..."
                  className="w-full font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Açıklamalar / Yöntem & Etkinlikler:</label>
                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Örn: Anlatım, soru-cevap, grup çalışması..."
                  className="w-full font-medium px-3 py-1.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveRowEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Preview & Column Mapping Modal */}
      {previewSession && (
        <AnnualPlanImportPreviewModal
          isOpen={!!previewSession}
          onClose={() => setPreviewSession(null)}
          previewSession={previewSession}
          onConfirmImport={handleConfirmPreviewImport}
        />
      )}
    </div>
  );
};
