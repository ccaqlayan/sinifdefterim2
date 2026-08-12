import React, { useState } from 'react';
import { Student } from '../types';
import { parseStudentListFromExcel } from '../utils/excel';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleExcelUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const parsed = await parseStudentListFromExcel(file);
      const studentPayloads: Omit<Student, 'id'>[] = parsed.map((p) => ({
        classId,
        number: p.number || '100',
        name: p.name || 'Öğrenci',
        surname: p.surname || '',
        parentName: p.parentName || 'Veli',
        parentPhone: p.parentPhone || '5550000000',
        parentEmail: p.parentEmail || '',
        notes: p.notes || '',
      }));

      onBulkAddStudents(studentPayloads);
      alert(`${studentPayloads.length} öğrenci başarıyla sınıfa eklendi!`);
      onClose();
    } catch (e) {
      alert('Excel dosyası okunurken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

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
        parentName: parts[3] || 'Veli',
        parentPhone: parts[4] || '5550000000',
        parentEmail: '',
      };
    });

    onBulkAddStudents(studentPayloads);
    alert(`${studentPayloads.length} öğrenci listeden eklendi!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-emerald-600" /> Toplu Öğrenci Yükleme
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'excel' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            📊 Excel Dosyası Seç (.xlsx)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'text' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            📋 Metin Kopyala / Yapıştır
          </button>
        </div>

        {activeTab === 'excel' ? (
          <div className="space-y-3 pt-2">
            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-6 rounded-2xl text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">
                {file ? file.name : 'Excel Sınıf Listesini Yükleyin'}
              </div>
              <p className="text-[11px] text-slate-500">
                Sütun Başlıkları: Okul No | Ad | Soyad | Veli Adı | Veli Telefon
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
              />
            </div>

            <button
              onClick={handleExcelUpload}
              disabled={!file || isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              {isProcessing ? 'Excel İşleniyor...' : 'Öğrencileri İçe Aktar'}
            </button>
          </div>
        ) : (
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
              placeholder="101, Ahmet, Yılmaz, Veli Telefon..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={handleTextPasteUpload}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Listeyi Kaydet ve Aktar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
