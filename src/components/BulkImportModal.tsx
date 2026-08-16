import React, { useState } from 'react';
import { Student } from '../types';
import {
  scanExcelFile,
  mapRowsToStudents,
  StudentTargetField,
  ExcelColumnScanResult,
} from '../utils/excel';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ListFilter,
  Check,
  ChevronRight,
  HelpCircle,
  X,
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onBulkAddStudents: (students: Omit<Student, 'id'>[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  classId,
  onBulkAddStudents,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [activeTab, setActiveTab] = useState<'excel' | 'text'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);

  // Excel Scanning & Mapping States
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [scanResult, setScanResult] = useState<ExcelColumnScanResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, StudentTargetField>>({});

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setRawText('');
    setStep('upload');
    setScanResult(null);
    setColumnMapping({});
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  // Step 1: File selection & scan
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const result = await scanExcelFile(selectedFile);
      setScanResult(result);
      setColumnMapping(result.initialMapping);
      setStep('mapping');
    } catch (err) {
      alert('Excel dosyası okunamadı. Lütfen geçerli bir .xlsx veya .xls dosyası seçiniz.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Change mapping for a specific Excel column
  const handleMappingChange = (colHeader: string, targetField: StudentTargetField) => {
    setColumnMapping((prev) => ({
      ...prev,
      [colHeader]: targetField,
    }));
  };

  // Proceed to Preview Step
  const handleProceedToPreview = () => {
    if (!scanResult) return;

    // Check if at least name or number field is mapped
    const mappedFields = Object.values(columnMapping);
    const hasName = mappedFields.includes('name');

    if (!hasName) {
      if (!window.confirm('Öğrenci adı için herhangi bir sütun eşleştirilmedi. Otomatik varsayılan isimler atansın mı?')) {
        return;
      }
    }

    setStep('preview');
  };

  // Final Import Action
  const handleFinalImport = () => {
    if (!scanResult) return;

    setIsProcessing(true);
    try {
      const parsedStudents = mapRowsToStudents(scanResult.rows, columnMapping);
      const studentPayloads: Omit<Student, 'id'>[] = parsedStudents.map((p) => ({
        classId,
        number: p.number || '100',
        name: p.name || 'Öğrenci',
        surname: p.surname || '',
        parentName: p.parentName && p.parentName !== '-' ? p.parentName : '-',
        parentPhone: p.parentPhone && p.parentPhone !== '-' ? p.parentPhone : '-',
        parentEmail: p.parentEmail || '',
        notes: p.notes || '',
      }));

      onBulkAddStudents(studentPayloads);
      alert(`Tebrikler! ${studentPayloads.length} öğrenci başarıyla sınıfa aktarıldı.`);
      handleCloseModal();
    } catch (err) {
      alert('İçe aktarılırken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Text Paste Fallback
  const handleTextPasteUpload = () => {
    if (!rawText.trim()) return;
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const studentPayloads: Omit<Student, 'id'>[] = lines.map((line, idx) => {
      const parts = line.split(/[\t,;]/).map((p) => p.trim());
      return {
        classId,
        number: parts[0] || String(100 + idx),
        name: parts[1] || 'Öğrenci',
        surname: parts[2] || '',
        parentName: parts[3] || '-',
        parentPhone: parts[4] || '-',
        parentEmail: '',
        notes: '',
      };
    });

    onBulkAddStudents(studentPayloads);
    alert(`${studentPayloads.length} öğrenci metin operasronuyla eklendi!`);
    handleCloseModal();
  };

  const previewStudents = scanResult ? mapRowsToStudents(scanResult.rows.slice(0, 5), columnMapping) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 space-y-4 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Excel'den Toplu Öğrenci Yükle
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Sütun başlıklarını tarayarak dilediğiniz veriyle eşleştirin</p>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('excel');
              setStep('upload');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'excel' ? 'bg-white text-emerald-700 shadow-2xs font-extrabold' : 'text-slate-600'
            }`}
          >
            📊 Excel Sütun Taraması (.xlsx)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'text' ? 'bg-white text-emerald-700 shadow-2xs font-extrabold' : 'text-slate-600'
            }`}
          >
            📋 Metin Kopyala / Yapıştır
          </button>
        </div>

        {activeTab === 'excel' ? (
          <div className="space-y-4">
            {/* Step Indicators */}
            <div className="flex items-center justify-around text-xs font-bold border-b border-slate-100 pb-3">
              <div
                className={`flex items-center gap-1.5 ${
                  step === 'upload' ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black">
                  1
                </span>
                Dosya Seçimi
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div
                className={`flex items-center gap-1.5 ${
                  step === 'mapping' ? 'text-emerald-700 font-black' : 'text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black">
                  2
                </span>
                Sütun Eşleştirme
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div
                className={`flex items-center gap-1.5 ${
                  step === 'preview' ? 'text-emerald-700 font-black' : 'text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black">
                  3
                </span>
                Onay & Aktar
              </div>
            </div>

            {/* STEP 1: Upload File */}
            {step === 'upload' && (
              <div className="space-y-3 pt-1">
                <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 p-6 rounded-3xl text-center space-y-3 transition-all">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Excel Sınıf Listesini Yükleyin</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      .xlsx, .xls veya .csv formatı desteklenir.
                    </p>
                  </div>

                  <div className="inline-block relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 mx-auto">
                      <FileSpreadsheet className="w-4 h-4" /> Excel Dosyası Seç
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="font-extrabold text-slate-800 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Sütun Başlıkları Esnektir:
                  </div>
                  <p>
                    Excel dosyanızdaki sütun başlıkları ne olursa olsun (örn: <em>"Öğrenci İsmi"</em>, <em>"Okul No"</em>, <em>"Adı Soyadı"</em>), sistem otomatik algılayacak ve ikinci adımda değiştirebileceksiniz.
                  </p>
                  <p className="text-indigo-700 font-bold mt-1">
                    ✨ Ad ve Soyadı ayrı sütunlarda veya tek birleşik sütunda olabilir. Birleşik ise sistem <strong>son kelimeyi soyadı</strong> kabul ederek otomatik ayırır.
                  </p>
                  <p className="text-emerald-700 font-bold mt-1">
                    ✓ Veli Adı ve Veli Telefonu zorunlu değildir, opsiyoneldir.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Column Mapping */}
            {step === 'mapping' && scanResult && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    Tespit Edilen Sütunlar ({scanResult.headers.length} Sütun)
                  </span>
                  <button
                    onClick={() => setStep('upload')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    Farklı Dosya Seç
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {scanResult.headers.map((colHeader, index) => {
                    const mappedValue = columnMapping[colHeader] || 'ignore';
                    const sampleValues = scanResult.rows
                      .slice(0, 2)
                      .map((r) => r[colHeader])
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <div
                        key={colHeader + index}
                        className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-4 h-4 bg-slate-200 text-slate-700 text-[10px] rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                            {colHeader}
                          </div>
                          {sampleValues && (
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                              Örnek: {sampleValues}
                            </p>
                          )}
                        </div>

                        {/* Mapping Dropdown */}
                        <select
                          value={mappedValue}
                          onChange={(e) =>
                            handleMappingChange(colHeader, e.target.value as StudentTargetField)
                          }
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                            mappedValue === 'name' || mappedValue === 'number'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : mappedValue === 'ignore'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                          }`}
                        >
                          <option value="name">📌 Öğrenci Adı (veya Birleşik Ad-Soyad)</option>
                          <option value="surname">📌 Öğrenci Soyadı (Ayrı Sütundaysa)</option>
                          <option value="number">📌 Okul / Öğrenci No</option>
                          <option value="parentName">👤 Veli Adı (Opsiyonel)</option>
                          <option value="parentPhone">📞 Veli Telefonu (Opsiyonel)</option>
                          <option value="parentEmail">📧 Veli E-posta (Opsiyonel)</option>
                          <option value="notes">📝 Öğretmen Notu (Opsiyonel)</option>
                          <option value="ignore">🚫 Yoksay / İçe Aktarma</option>
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Not:</strong> Veli Adı ve Veli Telefonu zorunlu değildir. Dosyada bu sütunlar yoksa <em>"Yoksay"</em> olarak bırakabilirsiniz.
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setStep('upload')}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Geri
                  </button>
                  <button
                    onClick={handleProceedToPreview}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    Önizlemeye Geç <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Preview & Confirm */}
            {step === 'preview' && scanResult && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    Aktarılacak Veri Önizlemesi ({scanResult.rows.length} Öğrenci)
                  </span>
                  <button
                    onClick={() => setStep('mapping')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    Eşleştirmeyi Düzenle
                  </button>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 text-[11px]">
                  <div className="grid grid-cols-4 bg-slate-200/80 font-black text-slate-700 p-2 border-b border-slate-200">
                    <div>Okul No</div>
                    <div>Ad Soyad</div>
                    <div>Veli Adı</div>
                    <div>Veli Tel</div>
                  </div>

                  <div className="divide-y divide-slate-200 max-h-40 overflow-y-auto">
                    {previewStudents.map((std, i) => (
                      <div key={i} className="grid grid-cols-4 p-2 bg-white text-slate-800">
                        <div className="font-bold text-indigo-700">#{std.number}</div>
                        <div className="font-bold">
                          {std.name} {std.surname}
                        </div>
                        <div className="text-slate-600">{std.parentName || '-'}</div>
                        <div className="text-slate-600">{std.parentPhone || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  Yukarıda ilk 5 öğrenci örneği gösterilmektedir. Toplam <strong>{scanResult.rows.length} öğrenci</strong> sınıfa eklenecektir.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setStep('mapping')}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Eşleştirmeye Dön
                  </button>
                  <button
                    onClick={handleFinalImport}
                    disabled={isProcessing}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isProcessing ? 'Sınıfa Aktarılıyor...' : `${scanResult.rows.length} Öğrenciyi Sınıfa Aktar`}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Text Paste Tab */
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">
              Her satıra bir öğrenci yazın. Örnek format (Tab veya virgül ile):
              <br />
              <code className="text-[10px] bg-slate-100 p-1 rounded font-mono block mt-1">
                101, Ahmet, Yılmaz, Mehmet Yılmaz, 5551234567
              </code>
            </p>

            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="101, Ahmet, Yılmaz..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-2xl font-mono focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={handleTextPasteUpload}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-xs"
            >
              Listeyi Kaydet ve Aktar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
