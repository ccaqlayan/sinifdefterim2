import React, { useState } from 'react';
import { Student } from '../types';
import { UserPlus, Camera, Save, Upload, Trash2, Image as ImageIcon, Zap } from 'lucide-react';
import { compressAvatarImage } from '../utils/imageUtils';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  studentToEdit?: Student | null;
  onSaveStudent: (student: Omit<Student, 'id'> | Student) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  classId,
  studentToEdit,
  onSaveStudent,
}) => {
  const [number, setNumber] = useState(studentToEdit?.number || '');
  const [name, setName] = useState(studentToEdit?.name || '');
  const [surname, setSurname] = useState(studentToEdit?.surname || '');
  const [photoUrl, setPhotoUrl] = useState(studentToEdit?.photoUrl || '');
  const [parentName, setParentName] = useState(studentToEdit?.parentName || '');
  const [parentPhone, setParentPhone] = useState(studentToEdit?.parentPhone || '5550000000');
  const [parentEmail, setParentEmail] = useState(studentToEdit?.parentEmail || '');
  const [notes, setNotes] = useState(studentToEdit?.notes || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDevicePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const result = await compressAvatarImage(file, 180, 0.75);
      setPhotoUrl(result.dataUrl);
      setPhotoSizeKb(result.compressedSizeKb);
    } catch (err) {
      alert('Fotoğraf işlenirken bir hata oluştu. Lütfen başka bir resim deneyin.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !number.trim()) {
      alert('Lütfen öğrenci adı ve okul numarasını doldurun.');
      return;
    }

    const payload = {
      ...(studentToEdit ? { id: studentToEdit.id } : {}),
      classId,
      number: number.trim(),
      name: name.trim(),
      surname: surname.trim(),
      photoUrl: photoUrl.trim() || undefined,
      parentName: parentName || 'Veli',
      parentPhone: parentPhone || '5550000000',
      parentEmail,
      notes,
    };

    onSaveStudent(payload as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            {studentToEdit ? 'Öğrenci Bilgilerini Güncelle' : 'Sınıfa Yeni Öğrenci Ekle'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Photo Preview & Device Upload Area */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs overflow-hidden relative group">
              {photoUrl ? (
                <img src={photoUrl} alt="Öğrenci" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-indigo-400" />
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 block">Öğrenci Fotoğrafı</span>
                {photoSizeKb && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {photoSizeKb} KB
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <label className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  {isUploadingPhoto ? 'Sıkıştırılıyor...' : 'Cihazdan Fotoğraf Seç'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDevicePhotoChange}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoSizeKb(null);
                    }}
                    className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Fotoğrafı Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kaldır
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Okul No</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Örn: 105"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ali"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Soyadı</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Örn: Yılmaz"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Fotoğraf Web Bağlantısı (URL)</span>
              <Camera className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://... (veya yukarıdan cihaz fotoğrafı yükleyin)"
              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-extrabold text-slate-800">Veli İletişim Bilgileri</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Veli Adı</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Veli Telefon (GSM)</label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="5551234567"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Öğretmen Notu</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Öğrencinin özel durumu, ilgi alanları..."
              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-1"
            >
              <Save className="w-4 h-4" /> Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
