import React, { useState } from 'react';
import { Student, Homework, HomeworkRecord, ClassRoom, User, AcademicYearConfig } from '../types';
import {
  HomeworkChecklistConfig,
  exportHomeworkChecklistToExcel,
  exportHomeworkChecklistToPdf,
  triggerDirectPrintHomeworkChecklist,
  prepareChecklistRows,
} from '../utils/homeworkChecklistExport';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  Sliders,
  Eye,
  Info,
  Download,
  School,
  Calendar,
  Layers,
  BookOpen,
  Loader2
} from 'lucide-react';

interface HomeworkChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  students: Student[];
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  currentUser?: User;
  academicYearConfig?: AcademicYearConfig;
}

export const HomeworkChecklistModal: React.FC<HomeworkChecklistModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  students,
  homeworks,
  homeworkRecords,
  currentUser,
  academicYearConfig,
}) => {
  const classStudents = students.filter((s) => s.classId === currentClass.id);
  const classHomeworks = homeworks.filter((h) => h.classId === currentClass.id && !h.isDeleted);

  const [config, setConfig] = useState<HomeworkChecklistConfig>({
    schoolName: currentUser?.schoolName || 'YILDIZ ANADOLU LİSESİ',
    academicYear: academicYearConfig?.yearName || '2026-2027',
    subject: currentClass.subject || currentUser?.subject || 'MATEMATİK',
    className: currentClass.name || '11/E',
    columnCount: 25,
    totalRowCount: Math.max(34, classStudents.length),
    fillExistingData: false,
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const { dateHeaders, rows } = prepareChecklistRows(classStudents, classHomeworks, homeworkRecords, config);

  const handlePrint = () => {
    triggerDirectPrintHomeworkChecklist(classStudents, classHomeworks, homeworkRecords, config);
  };

  const handleExportPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportHomeworkChecklistToPdf('homework-checklist-print-sheet', config);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportExcel = () => {
    exportHomeworkChecklistToExcel(classStudents, classHomeworks, homeworkRecords, config);
  };

  return (
    <div
      id="homework-checklist-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="homework-checklist-modal-container"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Ödev Takip Çizelgesi & Kontrol Listesi
                </h3>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                  {config.className} • {classStudents.length} Öğrenci • Tek Sayfa A4 Yatay
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Dikey tarih başlıkları ve net lejant kutucuğu ile tek sayfaya sığan resmi MEB formatında çizelge.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Settings Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Okul Adı
            </label>
            <input
              type="text"
              value={config.schoolName}
              onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Örn: YILDIZ ANADOLU LİSESİ"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Eğitim Yılı
            </label>
            <input
              type="text"
              value={config.academicYear}
              onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="2026-2027"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ders Adı
            </label>
            <input
              type="text"
              value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="MATEMATİK"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sınıf Şubesi
            </label>
            <input
              type="text"
              value={config.className}
              onChange={(e) => setConfig({ ...config, className: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="11/E"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sütun Sayısı
            </label>
            <select
              value={config.columnCount}
              onChange={(e) => setConfig({ ...config, columnCount: parseInt(e.target.value, 10) })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value={15}>15 Sütun</option>
              <option value={20}>20 Sütun</option>
              <option value={25}>25 Sütun (Standart)</option>
              <option value={30}>30 Sütun</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Doldurma Modu
            </label>
            <select
              value={config.fillExistingData ? 'filled' : 'blank'}
              onChange={(e) => setConfig({ ...config, fillExistingData: e.target.value === 'filled' })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="blank">Boş Şablon (Manuel)</option>
              <option value="filled">Kayıtlı Ödevleri Doldur</option>
            </select>
          </div>
        </div>

        {/* Live A4 Landscape Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100/90 flex justify-center">
          <div
            id="homework-checklist-print-sheet"
            className="sheet-print-container bg-white p-4 sm:p-5 shadow-md border border-slate-300 w-full max-w-[1040px] rounded-lg text-slate-900 font-sans"
            style={{ minHeight: '680px', backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            {/* Header Flex Container with Titles and Non-Overlapping Legend Box */}
            <div
              className="sheet-header-container flex items-start justify-between gap-2 mb-2 pb-1"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}
            >
              {/* Centered Titles */}
              <div className="sheet-titles flex-1 text-center pl-16 pr-2" style={{ flex: 1, textAlign: 'center' }}>
                <h4
                  className="sheet-title-1 text-sm sm:text-[14px] font-black tracking-wide text-slate-950 uppercase"
                  style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', marginBottom: '3px' }}
                >
                  {config.academicYear} EĞİTİM-ÖĞRETİM YILI {config.schoolName.toLocaleUpperCase('tr-TR')}
                </h4>
                <h5
                  className="sheet-title-2 text-xs sm:text-[12.5px] font-black tracking-wide text-slate-950 uppercase underline"
                  style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', textDecoration: 'underline', color: '#0f172a' }}
                >
                  {config.subject.toLocaleUpperCase('tr-TR')} DERSİ {config.className.toLocaleUpperCase('tr-TR')} SINIFI ÖDEV TAKİP ÇİZELGESİ
                </h5>
              </div>

              {/* Compact & High-Contrast Legend Box in Top Right */}
              <div
                className="sheet-legend-box shrink-0 border border-slate-700 bg-slate-50 rounded-md p-1.5 text-[9px] font-bold shadow-2xs text-left"
                style={{ border: '1px solid #334155', backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', flexShrink: 0 }}
              >
                <table className="border-collapse" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td className="pr-1 py-0.5 text-slate-800" style={{ color: '#1e293b', fontSize: '8px', lineHeight: 1.15 }}>Yaptı</td>
                      <td className="pr-1 py-0.5 text-slate-500" style={{ color: '#64748b', fontSize: '8px' }}>:</td>
                      <td className="sym-plus font-black text-emerald-700 text-[10px] text-center" style={{ color: '#047857', fontWeight: 900, fontSize: '9.5px', textAlign: 'center' }}>+</td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 text-slate-800" style={{ color: '#1e293b', fontSize: '8px', lineHeight: 1.15 }}>Yarım yaptı</td>
                      <td className="pr-1 py-0.5 text-slate-500" style={{ color: '#64748b', fontSize: '8px' }}>:</td>
                      <td className="sym-partial font-black text-amber-700 text-[10px] text-center" style={{ color: '#b45309', fontWeight: 900, fontSize: '9.5px', textAlign: 'center' }}>⊥</td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 text-slate-800" style={{ color: '#1e293b', fontSize: '8px', lineHeight: 1.15 }}>Yapmadı</td>
                      <td className="pr-1 py-0.5 text-slate-500" style={{ color: '#64748b', fontSize: '8px' }}>:</td>
                      <td className="sym-minus font-black text-rose-700 text-[10px] text-center" style={{ color: '#b91c1c', fontWeight: 900, fontSize: '9.5px', textAlign: 'center' }}>-</td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 text-slate-800" style={{ color: '#1e293b', fontSize: '8px', lineHeight: 1.15 }}>Gelmedi</td>
                      <td className="pr-1 py-0.5 text-slate-500" style={{ color: '#64748b', fontSize: '8px' }}>:</td>
                      <td className="sym-absent font-black text-indigo-700 text-[10px] text-center" style={{ color: '#4338ca', fontWeight: 900, fontSize: '9.5px', textAlign: 'center' }}>G</td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 text-slate-800" style={{ color: '#1e293b', fontSize: '8px', lineHeight: 1.15 }}>Geç Gösterdi</td>
                      <td className="pr-1 py-0.5 text-slate-500" style={{ color: '#64748b', fontSize: '8px' }}>:</td>
                      <td className="sym-late font-black text-blue-700 text-[10px] text-center" style={{ color: '#1d4ed8', fontWeight: 900, fontSize: '9.5px', textAlign: 'center' }}>G+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table with Vertical Rotated Headers */}
            <div className="overflow-x-auto border-2 border-slate-900 rounded-xs" style={{ border: '2px solid #0f172a' }}>
              <table className="sheet-table w-full border-collapse text-[10px] text-slate-950" style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a' }}>
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-center" style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #0f172a' }}>
                    <th className="col-sira border border-slate-400 p-1 w-7 text-center" style={{ border: '1px solid #64748b', width: '28px', padding: '1px', textAlign: 'center', overflow: 'visible' }}>Sıra</th>
                    <th className="col-no border border-slate-400 p-1 w-14 text-center" style={{ border: '1px solid #64748b', width: '54px', padding: '1px', textAlign: 'center', overflow: 'visible', whiteSpace: 'nowrap' }}>Öğr. No</th>
                    <th className="col-name border border-slate-400 p-1 text-left px-2 w-44" style={{ border: '1px solid #64748b', width: '175px', padding: '1px 5px', textAlign: 'left' }}>ADI SOYADI</th>
                    
                    {/* Vertical TARİH / SAYFA Column Header */}
                    <th className="col-vert border border-slate-400 p-0 w-9 h-14 align-middle text-center bg-slate-200" style={{ border: '1px solid #64748b', width: '36px', height: '56px', padding: 0, textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#e2e8f0', overflow: 'visible' }}>
                      <div className="h-full flex items-center justify-center -rotate-90 whitespace-nowrap text-[8px] font-black tracking-wider uppercase" style={{ transform: 'rotate(-90deg)', fontSize: '7.5px', fontWeight: 900, whiteSpace: 'nowrap', color: '#0f172a' }}>
                        TARİH/SAYFA
                      </div>
                    </th>

                    {/* Vertical Date / Homework Check Headers */}
                    {dateHeaders.map((dh, i) => (
                      <th
                        key={i}
                        className="col-vert border border-slate-400 p-0 min-w-[22px] max-w-[26px] h-14 align-middle text-center"
                        style={{ border: '1px solid #64748b', minWidth: '22px', maxWidth: '26px', height: '54px', padding: 0, textAlign: 'center', verticalAlign: 'middle' }}
                      >
                        <div className="h-full flex items-center justify-center -rotate-90 whitespace-nowrap text-[8.5px] font-bold text-slate-700" style={{ transform: 'rotate(-90deg)', fontSize: '8px', fontWeight: 800, whiteSpace: 'nowrap', color: '#334155' }}>
                          {dh || ''}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.index}
                      className="border-b border-slate-300 hover:bg-slate-50 even:bg-slate-50/50"
                      style={{ height: '21px', minHeight: '21px', borderBottom: '1px solid #cbd5e1' }}
                    >
                      <td className="col-sira border border-slate-300 text-center font-bold px-0.5 py-0.5 text-[9px]" style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, padding: '2px', fontSize: '8.5px', verticalAlign: 'middle' }}>
                        {r.index}
                      </td>
                      <td className="col-no border border-slate-300 text-center font-bold px-0.5 py-0.5 text-[9px]" style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, padding: '2px', fontSize: '8.5px', verticalAlign: 'middle' }}>
                        {r.studentNumber}
                      </td>
                      <td className="col-name border border-slate-300 font-extrabold px-1.5 py-0.5 text-[9px] truncate" style={{ border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 800, padding: '2px 5px', fontSize: '8.5px', lineHeight: '1.15', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>
                        {r.studentName}
                      </td>
                      <td className="border border-slate-300 text-center p-0 bg-slate-50/70" style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', padding: 0, verticalAlign: 'middle' }}></td>
                      {r.statuses.map((st, si) => (
                        <td
                          key={si}
                          className="col-check border border-slate-300 text-center font-black p-0 text-[10px]"
                          style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 900, fontSize: '10px', padding: 0, verticalAlign: 'middle' }}
                        >
                          {st}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Toplam: {rows.length} Satır • Sınıf Mevcudu: {classStudents.length} Öğrenci</span>
              <span>Sayfa 1 / 1 (A4 Yatay Baskı Uyumlu)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Türkçe karakterler, dikey tarih başlıkları ve net lejant ile tek sayfaya sığacak şekilde optimize edilmiştir.</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Direct Print Button */}
            <button
              type="button"
              id="btn-direct-print-hw"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Doğrudan Yazdır</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              id="btn-pdf-export-hw"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'PDF Hazırlanıyor...' : 'PDF Olarak İndir'}</span>
            </button>

            {/* Download Excel Button */}
            <button
              type="button"
              id="btn-excel-export-hw"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel Olarak İndir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
