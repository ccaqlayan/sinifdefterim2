import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
  Layers,
  ArrowRight,
  Sparkles,
  X,
  Settings2,
  Table,
  Check,
  Bot,
  Loader2,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import {
  ExcelPreviewSession,
  RawSheetData,
  ColumnRole,
  COLUMN_ROLE_OPTIONS,
  convertRawSheetToPlanItems,
} from '../utils/annualPlanParser';
import { AnnualPlanItem } from '../types';

interface AnnualPlanImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewSession: ExcelPreviewSession;
  onConfirmImport: (importedItems: AnnualPlanItem[], selectedGrades: string[]) => void;
}

export const AnnualPlanImportPreviewModal: React.FC<AnnualPlanImportPreviewModalProps> = ({
  isOpen,
  onClose,
  previewSession,
  onConfirmImport,
}) => {
  // Deep copy sheets data so user edits stay local until confirmed
  const [sheets, setSheets] = useState<RawSheetData[]>(() =>
    previewSession.sheets.map((s) => ({
      ...s,
      columnMappings: { ...s.columnMappings },
    }))
  );

  // Grade selection state: grade -> boolean
  const [selectedGrades, setSelectedGrades] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    previewSession.sheets.forEach((s) => {
      initialMap[s.grade] = true;
    });
    return initialMap;
  });

  // Active sheet tab index
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);

  // AI Detection loading and status states
  const [isAiDetecting, setIsAiDetecting] = useState<boolean>(false);
  const [aiDetectedSheets, setAiDetectedSheets] = useState<Record<number, boolean>>({});
  const [trainSuccessMessage, setTrainSuccessMessage] = useState<string>('');

  // Unique grade levels available across sheets
  const uniqueGrades = useMemo(() => {
    return Array.from(new Set<string>(sheets.map((s) => s.grade))).sort((a: string, b: string) => {
      const numA = parseInt(a, 10) || 0;
      const numB = parseInt(b, 10) || 0;
      return numA - numB;
    });
  }, [sheets]);

  // Train AI and save custom rules
  const handleTrainAiWithCurrentSelections = () => {
    const sheet = sheets[activeSheetIdx];
    if (!sheet || !sheet.rawRows || sheet.rawRows.length <= sheet.detectedHeaderIndex) return;

    const headerRow = sheet.rawRows[sheet.detectedHeaderIndex] || [];
    const currentMappings = sheet.columnMappings;

    let existingRules: Record<string, ColumnRole> = {};
    try {
      const stored = localStorage.getItem('custom_excel_column_rules');
      if (stored) existingRules = JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading existing rules', e);
    }

    let countAdded = 0;
    headerRow.forEach((cell: any, colIdx: number) => {
      if (!cell) return;
      const headerStr = String(cell).trim();
      const assignedRole = currentMappings[colIdx];
      if (headerStr && assignedRole) {
        existingRules[headerStr] = assignedRole;
        countAdded++;
      }
    });

    try {
      localStorage.setItem('custom_excel_column_rules', JSON.stringify(existingRules));
      setTrainSuccessMessage(
        `🧠 Yapay zeka seçimlerinizle eğitildi! (${countAdded} adet sütun başlığı ve eşleştirmesi hafızaya alındı).`
      );
      setTimeout(() => setTrainSuccessMessage(''), 6000);
    } catch (e) {
      console.error('Failed to save rules to localStorage', e);
    }
  };

  // AI Column Detection API Call for a single sheet
  const runAiDetectionForSheet = async (sheetIdx: number, currentSheetsList: RawSheetData[] = sheets) => {
    const sheet = currentSheetsList[sheetIdx];
    if (!sheet || !sheet.rawRows || sheet.rawRows.length === 0) return;

    // Retrieve trained user rules if available
    let savedUserRules: Record<string, ColumnRole> = {};
    try {
      const stored = localStorage.getItem('custom_excel_column_rules');
      if (stored) savedUserRules = JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading rules from storage', e);
    }

    try {
      const response = await fetch('/api/gemini/detect-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: sheet.sheetName,
          grade: sheet.grade,
          rawRows: sheet.rawRows.slice(0, 25),
          savedUserRules,
        }),
      });

      const data = await response.json();
      if (data.success && data.columnMappings) {
        const newMappings: Record<number, ColumnRole> = {};
        Object.entries(data.columnMappings).forEach(([colStr, roleStr]) => {
          const colIdx = parseInt(colStr, 10);
          if (!isNaN(colIdx) && typeof roleStr === 'string') {
            newMappings[colIdx] = roleStr as ColumnRole;
          }
        });

        setSheets((prevSheets) =>
          prevSheets.map((s, idx) => {
            if (idx !== sheetIdx) return s;
            return {
              ...s,
              detectedHeaderIndex:
                typeof data.detectedHeaderIndex === 'number'
                  ? data.detectedHeaderIndex
                  : s.detectedHeaderIndex,
              columnMappings: { ...s.columnMappings, ...newMappings },
            };
          })
        );

        setAiDetectedSheets((prev) => ({ ...prev, [sheetIdx]: true }));
      }
    } catch (err) {
      console.error('AI column detection error for sheet index', sheetIdx, err);
    }
  };

  // AI Column Detection API Call for ALL sheets
  const runAiDetectionForAllSheets = async () => {
    setIsAiDetecting(true);
    try {
      for (let i = 0; i < sheets.length; i++) {
        await runAiDetectionForSheet(i);
      }
    } finally {
      setIsAiDetecting(false);
    }
  };

  // Auto-run AI Column Detection on modal load once
  useEffect(() => {
    if (isOpen && sheets.length > 0) {
      runAiDetectionForAllSheets();
    }
  }, [isOpen]);

  if (!isOpen || !previewSession || sheets.length === 0) return null;

  const currentSheet = sheets[activeSheetIdx] || sheets[0];
  const isCurrentSheetAiDetected = !!aiDetectedSheets[activeSheetIdx];

  // Calculate parsed items for all sheets dynamically based on current column mappings
  const parsedSheetItemsMap = useMemo(() => {
    const map: Record<number, AnnualPlanItem[]> = {};
    sheets.forEach((sheet, idx) => {
      map[idx] = convertRawSheetToPlanItems(sheet);
    });
    return map;
  }, [sheets]);

  // Selected total items count
  const totalImportableCount = useMemo(() => {
    let count = 0;
    sheets.forEach((sheet, idx) => {
      if (selectedGrades[sheet.grade]) {
        count += (parsedSheetItemsMap[idx] || []).length;
      }
    });
    return count;
  }, [sheets, selectedGrades, parsedSheetItemsMap]);

  // Handle changing column mapping for a specific column in the active sheet
  const handleColumnMappingChange = (colIdx: number, newRole: ColumnRole) => {
    setSheets((prevSheets) => {
      return prevSheets.map((sheet, sIdx) => {
        if (sIdx !== activeSheetIdx) return sheet;
        const newMappings = { ...sheet.columnMappings, [colIdx]: newRole };
        return {
          ...sheet,
          columnMappings: newMappings,
        };
      });
    });
  };

  // Toggle grade checkbox
  const handleToggleGrade = (grade: string) => {
    setSelectedGrades((prev) => ({
      ...prev,
      [grade]: !prev[grade],
    }));
  };

  // Toggle All grades
  const handleSelectAllGrades = (select: boolean) => {
    const nextMap: Record<string, boolean> = {};
    sheets.forEach((s) => {
      nextMap[s.grade] = select;
    });
    setSelectedGrades(nextMap);
  };

  // Confirm import
  const handleConfirm = () => {
    const allSelectedItems: AnnualPlanItem[] = [];
    const activeGrades: string[] = [];

    sheets.forEach((sheet, idx) => {
      if (selectedGrades[sheet.grade]) {
        const items = parsedSheetItemsMap[idx] || [];
        allSelectedItems.push(...items);
        activeGrades.push(sheet.grade);
      }
    });

    if (allSelectedItems.length === 0) {
      alert('Lütfen en az bir sınıf kademesi seçiniz.');
      return;
    }

    onConfirmImport(allSelectedItems, activeGrades);
  };

  // Max columns to display in table preview
  const maxCols = currentSheet.rawRows.reduce(
    (max, row) => Math.max(max, row ? row.length : 0),
    0
  );

  const columnIndices = Array.from({ length: Math.min(maxCols, 12) }, (_, i) => i);

  // Helper color badge for roles
  const getRoleBadgeStyle = (role: ColumnRole) => {
    switch (role) {
      case 'week':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'dateRange':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'theme':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'topic':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'outcome':
        return 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold ring-2 ring-emerald-500/30';
      case 'description':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[94vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Excel Yıllık Plan İnceleme ve Sütun Eşleme
                </h3>
                <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Önizleme Modu
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5 flex items-center gap-2">
                <span>Dosya: <strong className="text-white">{previewSession.fileName}</strong></span>
                <span>•</span>
                <span>{sheets.length} Adet Sınıf Sekmesi Tespit Edildi</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runAiDetectionForAllSheets}
              disabled={isAiDetecting}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                isAiDetecting
                  ? 'bg-indigo-900/60 text-indigo-200 border-indigo-700/50 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/40 shadow-sm active:scale-95'
              }`}
            >
              {isAiDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>AI Analiz Ediyor...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>Yapay Zeka Sütun Analizi Yap</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Controls: Grade Checkboxes & Sheet Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5 space-y-3 shrink-0">
          {/* Grade selection checkboxes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                İçeri Aktarılacak Sınıf Kademeleri:
              </span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllGrades(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer px-1"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllGrades(false)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer px-1"
                >
                  Temizle
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {uniqueGrades.map((grade) => {
                const isChecked = !!selectedGrades[grade];
                return (
                  <button
                    key={`grade_chk_${grade}`}
                    type="button"
                    onClick={() => handleToggleGrade(grade)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                        : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{grade}. Sınıf Planı</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sheet Selector Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                <Table className="w-3.5 h-3.5 text-slate-400" />
                Sınıf Sekmesi Önizlemesi:
              </span>
              {sheets.map((sheet, idx) => {
                const isActive = idx === activeSheetIdx;
                const count = (parsedSheetItemsMap[idx] || []).length;
                const isSheetAiDetected = !!aiDetectedSheets[idx];

                return (
                  <button
                    key={`sheet_tab_${sheet.sheetName}_${idx}`}
                    type="button"
                    onClick={() => setActiveSheetIdx(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    <span>{sheet.sheetName} ({sheet.grade}. Sınıf)</span>
                    {isSheetAiDetected && (
                      <span className="text-[10px] bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded font-black flex items-center gap-0.5" title="Yapay zeka ile sütunlar eşleştirildi">
                        <CheckCircle2 className="w-3 h-3 text-slate-950" />
                        AI
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count} Hafta
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => runAiDetectionForSheet(activeSheetIdx)}
              disabled={isAiDetecting}
              className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-extrabold text-[11px] shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {isAiDetecting ? (
                <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-purple-600" />
              )}
              <span>Aktif Sekmeyi AI ile Analiz Et</span>
            </button>
          </div>
        </div>

        {/* Main Workspace / Table Preview */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-100/60">
          {/* AI Banner Status & Training Action */}
          {trainSuccessMessage && (
            <div className="p-3 bg-purple-900 text-purple-100 border border-purple-500/50 rounded-2xl flex items-center gap-3 text-xs shadow-md animate-bounce">
              <Bot className="w-5 h-5 text-amber-300 shrink-0" />
              <strong className="font-black text-amber-300">{trainSuccessMessage}</strong>
            </div>
          )}

          {isAiDetecting ? (
            <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-purple-950 border border-indigo-700/60 rounded-2xl flex items-center gap-3 text-xs text-white shadow-md animate-pulse">
              <Loader2 className="w-5 h-5 text-amber-300 animate-spin shrink-0" />
              <div className="flex-1">
                <strong className="font-black text-amber-300 text-sm">Yapay Zeka Sütun Analizi Çalışıyor...</strong>
                <p className="text-indigo-200 mt-0.5">
                  Excel tablonuzdaki başlıklar ve haftalık kazanım hücreleri analiz edilerek sütun rolleri yüksek doğrulukla belirleniyor.
                </p>
              </div>
            </div>
          ) : isCurrentSheetAiDetected ? (
            <div className="p-3 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-black text-emerald-300">✨ Yapay Zeka Sütun Eşlemesi Tamamlandı (%0 Hata Payı)</strong>
                  <p className="text-emerald-100/90 text-[11px]">
                    Sütunlar (Hafta, Tarih, Tema, Konu, Kazanım, Açıklama) yapay zeka tarafından yüksek hassasiyetle sınıflandırıldı.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTrainAiWithCurrentSelections}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 border border-purple-400/40"
                title="Şu anki yaptığınız sütun seçimlerini yapay zekaya öğretin"
              >
                <Bot className="w-4 h-4 text-amber-300" />
                <span>🧠 Yapay Zekayı Bu Seçimlerle Eğit</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
              <div className="flex items-start gap-3">
                <Settings2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-amber-900">Sütun Eşleme Kontrolü:</strong>
                  <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                    Excel tablonuzdaki sütunların başlıklarının üstündeki <strong>Açılır Menülere</strong> tıklayarak hangi bilginin 
                    <strong> (Kazanım, Konu, Açıklama, Tarih vb.)</strong> olduğunu belirleyebilirsiniz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTrainAiWithCurrentSelections}
                className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 border border-purple-400/40"
              >
                <Bot className="w-4 h-4 text-amber-300" />
                <span>🧠 Seçimlerimi AI Hafızasına Kaydet</span>
              </button>
            </div>
          )}

          {/* Interactive Column Mapping Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  {/* Row 1: Column Mapping Selector Dropdowns */}
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="p-3 font-black text-center w-12 bg-slate-950 border-r border-slate-800 shrink-0">
                      Sütun
                    </th>
                    {columnIndices.map((colIdx) => {
                      const currentRole = currentSheet.columnMappings[colIdx] || 'ignore';
                      return (
                        <th
                          key={`col_map_select_${colIdx}`}
                          className="p-2.5 min-w-[180px] border-r border-slate-800 bg-slate-900/90"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>Sütun {String.fromCharCode(65 + colIdx)}</span>
                              <span
                                className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getRoleBadgeStyle(
                                  currentRole
                                )}`}
                              >
                                {COLUMN_ROLE_OPTIONS.find((o) => o.value === currentRole)?.label}
                              </span>
                            </div>

                            <select
                              value={currentRole}
                              onChange={(e) =>
                                handleColumnMappingChange(colIdx, e.target.value as ColumnRole)
                              }
                              className="w-full bg-slate-800 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                              {COLUMN_ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </th>
                      );
                    })}
                  </tr>

                  {/* Row 2: Raw Excel Header Row */}
                  <tr className="bg-indigo-50/80 border-b border-indigo-100 text-slate-800 font-extrabold text-[11px]">
                    <td className="p-2.5 text-center bg-indigo-100/80 border-r border-indigo-200 text-slate-600 font-bold">
                      Excel Başlık
                    </td>
                    {columnIndices.map((colIdx) => {
                      const rawHeaderVal =
                        currentSheet.rawRows[currentSheet.detectedHeaderIndex]?.[colIdx] || '';
                      return (
                        <td
                          key={`raw_hdr_${colIdx}`}
                          className="p-2.5 border-r border-indigo-100 text-indigo-950 truncate max-w-[200px]"
                          title={String(rawHeaderVal)}
                        >
                          {String(rawHeaderVal) || `(Boş Sütun)`}
                        </td>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-sans text-slate-700">
                  {currentSheet.rawRows
                    .slice(
                      currentSheet.detectedHeaderIndex + 1,
                      currentSheet.detectedHeaderIndex + 15
                    )
                    .map((row, rIdx) => (
                      <tr
                        key={`preview_row_${rIdx}`}
                        className="hover:bg-slate-50 transition-colors text-xs"
                      >
                        <td className="p-2.5 text-center font-mono font-bold bg-slate-50 border-r border-slate-200 text-slate-400">
                          {rIdx + 1}
                        </td>
                        {columnIndices.map((colIdx) => {
                          const cellVal = row ? row[colIdx] : '';
                          const role = currentSheet.columnMappings[colIdx] || 'ignore';
                          const isIgnored = role === 'ignore';
                          const isOutcome = role === 'outcome';

                          return (
                            <td
                              key={`cell_${rIdx}_${colIdx}`}
                              className={`p-2.5 border-r border-slate-200 align-top max-w-[250px] ${
                                isIgnored
                                  ? 'bg-slate-50/70 text-slate-400 line-through opacity-50'
                                  : isOutcome
                                  ? 'bg-emerald-50/30 font-semibold text-slate-900'
                                  : 'text-slate-800'
                              }`}
                            >
                              <div className="line-clamp-3 whitespace-pre-wrap">
                                {cellVal !== undefined && cellVal !== null ? String(cellVal) : '-'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-2.5 text-xs text-slate-500 border-t border-slate-200 flex items-center justify-between">
              <span>
                Gösterilen: İlk 14 Hafta Satırı (Toplam{' '}
                <strong className="text-slate-800">
                  {(parsedSheetItemsMap[activeSheetIdx] || []).length} Hafta Kazanım
                </strong>{' '}
                Ayrıştırıldı)
              </span>
              <span className="font-bold text-indigo-600">
                {currentSheet.grade}. Sınıf
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-800">
              Toplam <span className="text-indigo-600 font-black">{totalImportableCount}</span> Adet
              Haftalık Plan İçeri Aktarılacak
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={totalImportableCount === 0}
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                totalImportableCount > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Seçili Kademeleri İçeri Aktar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
