import React, { useState } from 'react';
import { Student } from '../types';
import { UserPlus, Camera, Save } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !surname.trim() || !number.trim()) {
      alert('Lütfen öğrenci adı, soyadı ve okul numarasını doldurun.');
      return;
    }

    const payload = {
      ...(studentToEdit ? { id: studentToEdit.id } : {}),
      classId,
      number,
      name,
      surname,
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Fotoğraf URL (İsteğe Bağlı)</span>
              <Camera className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
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
