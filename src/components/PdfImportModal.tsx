import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ClassRoom, Student } from '../types';
import { splitFullName } from '../utils/excel';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Edit3,
  User,
  Image as ImageIcon,
  Building2,
  Check,
} from 'lucide-react';

// Configure PDFJS Worker with matching version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ExtractedStudent {
  id: string;
  number: string;
  name: string;
  surname: string;
  photoUrl: string;
}

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  selectedClassId?: string;
  onBulkAddStudents: (students: Omit<Student, 'id'>[], targetClassId?: string, newClassName?: string) => void;
  onAddClass?: (cls: Omit<ClassRoom, 'id'>) => ClassRoom | string | void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onBulkAddStudents,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload');
  const [loadingText, setLoadingText] = useState('');
  const [detectedClassName, setDetectedClassName] = useState('9/C');
  const [targetClassOption, setTargetClassOption] = useState<'create' | 'existing'>('create');
  const [selectedClassIdState, setSelectedClassIdState] = useState<string>(
    selectedClassId || (classes.length > 0 ? classes[0].id : '')
  );
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudent[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setStep('upload');
    setLoadingText('');
    setExtractedStudents([]);
    setDetectedClassName('9/C');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Process canvas to crop individual photos based on Gemini bounding boxes
  const cropPhotoFromCanvas = (
    canvas: HTMLCanvasElement,
    photoBox: [number, number, number, number]
  ): string => {
    try {
      const [ymin, xmin, ymax, xmax] = photoBox;
      const cropX = Math.max(0, Math.round((xmin / 1000) * canvas.width));
      const cropY = Math.max(0, Math.round((ymin / 1000) * canvas.height));
      const cropW = Math.max(20, Math.round(((xmax - xmin) / 1000) * canvas.width));
      const cropH = Math.max(20, Math.round(((ymax - ymin) / 1000) * canvas.height));

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;

      const ctx = cropCanvas.getContext('2d');
      if (!ctx) return '';

      ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return cropCanvas.toDataURL('image/jpeg', 0.88);
    } catch (e) {
      console.error('Photo crop error:', e);
      return '';
    }
  };

  // Process PDF or Image file
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('processing');
    setLoadingText('Belge ve sayfalar taranıyor...');

    try {
      let pageCanvases: HTMLCanvasElement[] = [];

      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        // Handle PDF file using PDF.js
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        setLoadingText(`PDF okundu (${pdfDoc.numPages} sayfa). Yüksek çözünürlükte işleniyor...`);

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // High resolution scale

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
            pageCanvases.push(canvas);
          }
        }
      } else if (selectedFile.type.startsWith('image/')) {
        // Handle Image file directly
        const img = new Image();
        const dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(selectedFile);
        });

        await new Promise((res) => {
          img.onload = res;
          img.src = dataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          pageCanvases.push(canvas);
        }
      } else {
        alert('Lütfen geçerli bir PDF veya resim (JPG, PNG) dosyası seçiniz.');
        setStep('upload');
        return;
      }

      if (pageCanvases.length === 0) {
        throw new Error('Belgeden sayfa görüntüsü alınamadı.');
      }

      // Analyze pages using AI Vision Endpoint
      let allStudents: ExtractedStudent[] = [];
      let foundClassName = '9/C';

      for (let pageIdx = 0; pageIdx < pageCanvases.length; pageIdx++) {
        setLoadingText(`Yapay Zeka e-Okul listesini ve vesikalık fotoğrafları kesiyor (${pageIdx + 1}/${pageCanvases.length}. sayfa)...`);

        const canvas = pageCanvases[pageIdx];
        const pageBase64 = canvas.toDataURL('image/jpeg', 0.85);

        const response = await fetch('/api/gemini/parse-pdf-class-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: pageBase64 }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Yapay Zeka belgeyi çözümleyemedi.');
        }

        const data = await response.json();
        if (data.className && data.className.trim()) {
          foundClassName = data.className.trim();
        }

        if (Array.isArray(data.students)) {
          data.students.forEach((st: any, idx: number) => {
            const splitName = splitFullName(st.fullName || '');
            let photoUrl = '';

            if (st.photoBox && Array.isArray(st.photoBox) && st.photoBox.length === 4) {
              photoUrl = cropPhotoFromCanvas(canvas, st.photoBox);
            }

            allStudents.push({
              id: `st_${pageIdx}_${idx}_${Date.now()}`,
              number: String(st.number || Math.floor(100 + Math.random() * 899)),
              name: splitName.name || st.fullName || `Öğrenci ${idx + 1}`,
              surname: splitName.surname || '',
              photoUrl,
            });
          });
        }
      }

      setDetectedClassName(foundClassName);
      setExtractedStudents(allStudents);
      setStep('preview');
    } catch (err: any) {
      console.error('PDF Import Error:', err);
      alert(`Hata: ${err.message || 'PDF veya belge işlenirken bir sorun oluştu.'}`);
      setStep('upload');
    }
  };

  // Remove a student from list before importing
  const handleRemoveStudent = (id: string) => {
    setExtractedStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Update a student details in preview
  const handleUpdateStudent = (id: string, field: keyof ExtractedStudent, val: string) => {
    setExtractedStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Final Action: Batch Import into Class
  const handleFinalImport = () => {
    if (extractedStudents.length === 0) {
      alert('Aktarılacak öğrenci bulunamadı.');
      return;
    }

    const payloads: Omit<Student, 'id'>[] = extractedStudents.map((s) => ({
      classId: targetClassOption === 'existing' ? selectedClassIdState : '',
      number: s.number || '100',
      name: s.name || 'Öğrenci',
      surname: s.surname || '',
      photoUrl: s.photoUrl || undefined,
      parentName: '-',
      parentPhone: '-',
      parentEmail: '',
      notes: 'e-Okul PDF listesinden fotoğraflarıyla aktarıldı',
    }));

    if (targetClassOption === 'create') {
      onBulkAddStudents(payloads, undefined, detectedClassName);
    } else {
      onBulkAddStudents(payloads, selectedClassIdState);
    }

    alert(`Tebrikler! ${payloads.length} öğrenci fotoğraflarıyla birlikte başarıyla sınıfa aktarıldı.`);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-slate-100 space-y-4 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" /> e-Okul PDF'den Fotoğraflı Sınıf Yükle
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              e-Okul fotoğraflı şube listesinden sınıf, öğrenci no, ad-soyad ve <strong>fotoğrafları otomatik kesip aktarın</strong>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Upload Area */}
        {step === 'upload' && (
          <div className="space-y-4 pt-1">
            <div className="border-2 border-dashed border-rose-200 bg-rose-50/40 hover:bg-rose-50/80 p-8 rounded-3xl text-center space-y-3 transition-all">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-2xs">
                <FileText className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  e-Okul Fotoğraflı Sınıf Listesi PDF'ini Seçin
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  MEB e-Okul sisteminden indirdiğiniz <em>"Fotoğraflı Şube Öğrenci Listesi"</em> PDF veya fotoğraf belgesini yükleyin.
                </p>
              </div>

              <div className="inline-block relative">
                <input
                  type="file"
                  accept=".pdf, image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <button className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto">
                  <Upload className="w-4 h-4" /> PDF veya Belge Seç
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" /> Akıllı Fotoğraf & Veri Ayrıştırma Özelliği:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>Sistem PDF belgesini tarayarak sınıf adını (örn: <strong>9/C</strong>) otomatik tespit eder.</li>
                <li>Her öğrencinin vesikalık fotoğrafını milimetrik hassasiyetle keser ve profil fotoğrafı yapar.</li>
                <li>Okul Numarası, Ad ve Soyadı otomatik ayrıştırılır.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Processing State */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-rose-600">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900">Yapay Zeka Belgeyi Çözümlüyor</h4>
              <p className="text-xs text-rose-700 font-bold mt-1">{loadingText}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Bu işlem belgedeki öğrenci sayısına bağlı olarak birkaç saniye sürebilir...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Confirmation Grid */}
        {step === 'preview' && (
          <div className="space-y-4 pt-1">
            {/* Target Class Selection */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-black text-slate-800 block">
                1. Aktarılacak Sınıf Seçimi
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setTargetClassOption('create')}
                  className={`p-2.5 rounded-xl border font-bold cursor-pointer flex items-center gap-2 transition-all ${
                    targetClassOption === 'create'
                      ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetClassOption"
                    checked={targetClassOption === 'create'}
                    onChange={() => setTargetClassOption('create')}
                    className="accent-rose-600"
                  />
                  <div>
                    <span>Yeni Sınıf Oluştur:</span>
                    <input
                      type="text"
                      value={detectedClassName}
                      onChange={(e) => setDetectedClassName(e.target.value)}
                      className="mt-0.5 w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg font-black text-rose-900"
                    />
                  </div>
                </label>

                {classes.length > 0 && (
                  <label
                    onClick={() => setTargetClassOption('existing')}
                    className={`p-2.5 rounded-xl border font-bold cursor-pointer flex items-center gap-2 transition-all ${
                      targetClassOption === 'existing'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetClassOption"
                      checked={targetClassOption === 'existing'}
                      onChange={() => setTargetClassOption('existing')}
                      className="accent-rose-600"
                    />
                    <div className="w-full">
                      <span>Mevcut Sınıfa Ekle:</span>
                      <select
                        value={selectedClassIdState}
                        onChange={(e) => setSelectedClassIdState(e.target.value)}
                        disabled={targetClassOption !== 'existing'}
                        className="mt-0.5 w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg font-extrabold text-slate-800"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.grade}. Sınıf - {c.subject})
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Extracted Students Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">
                  2. Tespit Edilen Öğrenciler & Kesilen Fotoğraflar ({extractedStudents.length} Öğrenci)
                </span>
                <span className="text-[11px] font-bold text-rose-700">
                  ✓ Fotoğraflar otomatik kırpıldı
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extractedStudents.map((std, idx) => (
                  <div
                    key={std.id}
                    className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center gap-2.5 relative group hover:border-rose-200 transition-all"
                  >
                    {/* Cropped Student Headshot */}
                    <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300 shadow-2xs relative">
                      {std.photoUrl ? (
                        <img
                          src={std.photoUrl}
                          alt={std.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400 m-auto mt-3" />
                      )}
                    </div>

                    {/* Student Info Inputs */}
                    <div className="flex-1 min-w-0 space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md shrink-0">
                          #{std.number}
                        </span>
                        <input
                          type="text"
                          value={std.number}
                          onChange={(e) => handleUpdateStudent(std.id, 'number', e.target.value)}
                          placeholder="Okul No"
                          className="w-14 text-[11px] font-bold px-1 py-0.5 border border-slate-200 rounded bg-white"
                        />
                      </div>

                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={std.name}
                          onChange={(e) => handleUpdateStudent(std.id, 'name', e.target.value)}
                          placeholder="Adı"
                          className="w-full text-[11px] font-bold px-1.5 py-0.5 border border-slate-200 rounded bg-white truncate"
                        />
                        <input
                          type="text"
                          value={std.surname}
                          onChange={(e) => handleUpdateStudent(std.id, 'surname', e.target.value)}
                          placeholder="Soyadı"
                          className="w-full text-[11px] font-bold px-1.5 py-0.5 border border-slate-200 rounded bg-white truncate"
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveStudent(std.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setStep('upload')}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Farklı Belge Seç
              </button>
              <button
                onClick={handleFinalImport}
                className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {extractedStudents.length} Öğrenciyi Fotoğraflarıyla Aktar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
