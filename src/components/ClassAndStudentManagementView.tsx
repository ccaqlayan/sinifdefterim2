import React, { useState, useMemo } from 'react';
import { ClassRoom, Student, StudentBadge } from '../types';
import { isBadgeActive } from '../utils/badgeUtils';
import {
  Users,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowRightLeft,
  Copy,
  Download,
  Upload,
  CheckSquare,
  Square,
  AlertTriangle,
  ChevronDown,
  Filter,
  UserPlus,
  Building2,
  Sparkles,
  Phone,
  Hash,
  ArrowUpDown,
  Check,
  X,
  FileSpreadsheet,
  GraduationCap,
  Camera,
  FileText
} from 'lucide-react';
import { exportStudentListToExcel, splitFullName } from '../utils/excel';
import { compressImageFile } from '../utils/imageUtils';

interface ClassAndStudentManagementViewProps {
  classes: ClassRoom[];
  students: Student[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onAddClass: (newClass: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  onUpdateClass: (updatedClass: ClassRoom) => void;
  onDeleteClass: (classId: string, actionOnStudents: 'delete' | 'transfer', targetClassId?: string) => void;
  onSaveStudent: (student: Omit<Student, 'id'> | Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteMultipleStudents: (studentIds: string[]) => void;
  onTransferStudents: (studentIds: string[], targetClassId: string) => void;
  onOpenBulkImport: () => void;
  onOpenPdfImport?: () => void;
  onOpenAddClassModal: () => void;
  badges?: StudentBadge[];
}

export const ClassAndStudentManagementView: React.FC<ClassAndStudentManagementViewProps> = ({
  classes,
  students,
  selectedClassId,
  onSelectClass,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onSaveStudent,
  onDeleteStudent,
  onDeleteMultipleStudents,
  onTransferStudents,
  onOpenBulkImport,
  onOpenPdfImport,
  onOpenAddClassModal,
  badges = [],
}) => {
  // Main Tab in Management: default to 'classes' if no classes exist yet
  const [activeTab, setActiveTab] = useState<'classes' | 'students'>(
    classes.length > 0 ? 'students' : 'classes'
  );

  // Search & Filter State
  const [studentSearch, setStudentSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>(selectedClassId || 'all');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'surname' | 'class'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Class Search
  const [classSearch, setClassSearch] = useState('');

  // Multi-select for Bulk Actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Editing Modals / Dialogs local state
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null);
  const [deleteClassOption, setDeleteClassOption] = useState<'delete' | 'transfer'>('transfer');
  const [deleteClassTargetId, setDeleteClassTargetId] = useState<string>('');

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Bulk Transfer Dialog
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState<string>('');

  // Single Transfer Student
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [singleTargetClassId, setSingleTargetClassId] = useState<string>('');

  // Form State for Student Modal/Drawer
  const [stdNumber, setStdNumber] = useState('');
  const [stdName, setStdName] = useState('');
  const [stdSurname, setStdSurname] = useState('');
  const [stdClassId, setStdClassId] = useState(selectedClassId || (classes[0]?.id || ''));
  const [stdPhotoUrl, setStdPhotoUrl] = useState('');
  const [stdParentName, setStdParentName] = useState('');
  const [stdParentPhone, setStdParentPhone] = useState('');
  const [stdParentEmail, setStdParentEmail] = useState('');
  const [stdNotes, setStdNotes] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleDevicePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 280, 280, 0.85);
      setStdPhotoUrl(compressedDataUrl);
    } catch (err) {
      alert('Fotoğraf yüklenirken bir hata oluştu. Lütfen başka bir resim dosyası seçin.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Form State for Class Editing Modal
  const [clsName, setClsName] = useState('');
  const [clsGrade, setClsGrade] = useState('9');
  const [clsSubject, setClsSubject] = useState('Matematik');
  const [clsTerm, setClsTerm] = useState('2025-2026 2. Dönem');

  // Open Edit Student
  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStdNumber(student.number);
    setStdName(student.name);
    setStdSurname(student.surname);
    setStdClassId(student.classId);
    setStdPhotoUrl(student.photoUrl || '');
    setStdParentName(student.parentName || '');
    setStdParentPhone(student.parentPhone || '');
    setStdParentEmail(student.parentEmail || '');
    setStdNotes(student.notes || '');
    setIsStudentModalOpen(true);
  };

  // Open New Student
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStdNumber('');
    setStdName('');
    setStdSurname('');
    setStdClassId(filterClassId !== 'all' ? filterClassId : selectedClassId || (classes[0]?.id || ''));
    setStdPhotoUrl('');
    setStdParentName('');
    setStdParentPhone('5550000000');
    setStdParentEmail('');
    setStdNotes('');
    setIsStudentModalOpen(true);
  };

  // Save Student (Add or Edit)
  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdName.trim() || !stdNumber.trim() || !stdClassId) {
      alert('Lütfen öğrenci no, ad ve sınıf seçiniz.');
      return;
    }

    let finalName = stdName.trim();
    let finalSurname = stdSurname.trim();

    if (!finalSurname && finalName.includes(' ')) {
      const split = splitFullName(finalName);
      finalName = split.name;
      finalSurname = split.surname;
    }

    // Check duplicate student number in same class
    const existing = students.find(
      (s) => s.classId === stdClassId && s.number.trim() === stdNumber.trim() && s.id !== editingStudent?.id
    );
    if (existing) {
      if (!window.confirm(`Uyarı: ${stdClassId} sınıfında #${stdNumber} numaralı ${existing.name} ${existing.surname} zaten var. Yine de kaydedilsin mi?`)) {
        return;
      }
    }

    onSaveStudent({
      ...(editingStudent ? { id: editingStudent.id } : {}),
      classId: stdClassId,
      number: stdNumber.trim(),
      name: finalName,
      surname: finalSurname,
      photoUrl: stdPhotoUrl.trim() || undefined,
      parentName: stdParentName.trim() || 'Veli',
      parentPhone: stdParentPhone.trim() || '5550000000',
      parentEmail: stdParentEmail.trim(),
      notes: stdNotes.trim(),
    });

    setIsStudentModalOpen(false);
  };

  // Open Edit Class
  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClsName(cls.name);
    setClsGrade(cls.grade);
    setClsSubject(cls.subject);
    setClsTerm(cls.term);
  };

  // Save Class Edit
  const handleSaveClassEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !clsName.trim()) return;

    onUpdateClass({
      ...editingClass,
      name: clsName.trim(),
      grade: clsGrade,
      subject: clsSubject.trim(),
      term: clsTerm.trim(),
    });

    setEditingClass(null);
  };

  // Duplicate Class
  const handleDuplicateClass = (cls: ClassRoom) => {
    const newClassName = `${cls.name} (Kopya)`;
    onAddClass({
      name: newClassName,
      grade: cls.grade,
      subject: cls.subject,
      term: cls.term,
    });
  };

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Class filter
    if (filterClassId && filterClassId !== 'all') {
      result = result.filter((s) => s.classId === filterClassId);
    }

    // Text search
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.surname.toLowerCase().includes(q) ||
          s.number.toLowerCase().includes(q) ||
          s.parentName?.toLowerCase().includes(q) ||
          s.parentPhone?.includes(q) ||
          s.notes?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'number') {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          cmp = numA - numB;
        } else {
          cmp = a.number.localeCompare(b.number);
        }
      } else if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name, 'tr');
      } else if (sortBy === 'surname') {
        cmp = a.surname.localeCompare(b.surname, 'tr');
      } else if (sortBy === 'class') {
        cmp = a.classId.localeCompare(b.classId);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [students, filterClassId, studentSearch, sortBy, sortOrder]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    if (!classSearch.trim()) return classes;
    const q = classSearch.toLowerCase().trim();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.term.toLowerCase().includes(q)
    );
  }, [classes, classSearch]);

  // Multi-select helpers
  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Transfer Submit
  const handleBulkTransferSubmit = () => {
    if (!bulkTargetClassId) {
      alert('Lütfen hedef sınıfı seçiniz.');
      return;
    }
    onTransferStudents(selectedStudentIds, bulkTargetClassId);
    setSelectedStudentIds([]);
    setIsBulkTransferOpen(false);
  };

  // Bulk Delete
  const handleBulkDeleteSubmit = () => {
    if (selectedStudentIds.length === 0) return;
    if (
      window.confirm(
        `Seçili ${selectedStudentIds.length} öğrenciyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      onDeleteMultipleStudents(selectedStudentIds);
      setSelectedStudentIds([]);
    }
  };

  // Single Transfer Submit
  const handleSingleTransferSubmit = () => {
    if (!transferringStudent || !singleTargetClassId) return;
    onTransferStudents([transferringStudent.id], singleTargetClassId);
    setTransferringStudent(null);
  };

  // Class Delete Confirmation Submit
  const handleConfirmDeleteClass = () => {
    if (!deletingClass) return;
    const classStudentsCount = students.filter((s) => s.classId === deletingClass.id).length;

    if (classStudentsCount > 0 && deleteClassOption === 'transfer' && !deleteClassTargetId) {
      alert('Lütfen öğrencilerin aktarılacağı hedef sınıfı seçiniz.');
      return;
    }

    onDeleteClass(deletingClass.id, deleteClassOption, deleteClassTargetId);
    setDeletingClass(null);
  };

  // Export List to Excel
  const handleExportStudents = () => {
    const classNameLabel =
      filterClassId === 'all'
        ? 'Tüm_Sınıflar'
        : classes.find((c) => c.id === filterClassId)?.name || 'Sınıf';
    exportStudentListToExcel(classNameLabel, filteredStudents);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200">
      {/* Top Banner & Mode Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Sınıf & Öğrenci Yönetim Merkezi
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sınıf tanımlama, öğrenci kayıt düzenleme, toplu nakil ve aktarım işlemleri
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 font-bold text-xs">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" /> Öğrenci Listesi ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'classes'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" /> Sınıflar & Branşlar ({classes.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT MANAGEMENT (Öğrenci Yönetimi)                            */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          {/* Controls Bar: Search, Class Filter, Sort, Add, Import */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            {/* Search Input & Add buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Ad, Soyad, Okul No, Veli veya Tel ara..."
                  className="w-full text-xs font-medium pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleOpenAddStudent}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Öğrenci Ekle
                </button>

                <button
                  onClick={onOpenBulkImport}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                  title="Excel / Metin yapıştırarak toplu ekle"
                >
                  <Upload className="w-4 h-4 text-emerald-600" /> Excel Yükle
                </button>

                {onOpenPdfImport && (
                  <button
                    onClick={onOpenPdfImport}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1 transition-all shadow-2xs"
                    title="e-Okul Fotoğraflı Sınıf Listesi PDF / Belge yükle"
                  >
                    <FileText className="w-4 h-4 text-rose-600" /> PDF'den Yükle (e-Okul)
                  </button>
                )}

                <button
                  onClick={handleExportStudents}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                  title="Listeyi Excel olarak indir"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> İndir
                </button>
              </div>
            </div>

            {/* Class Filter Dropdown & Sorting controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" /> Sınıf:
                </span>
                <select
                  value={filterClassId}
                  onChange={(e) => {
                    setFilterClassId(e.target.value);
                    if (e.target.value !== 'all') {
                      onSelectClass(e.target.value);
                    }
                  }}
                  className="bg-indigo-50 border border-indigo-200 font-bold text-indigo-900 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Tüm Sınıflar ({students.length} Öğrenci)</option>
                  {classes.map((cls) => {
                    const count = students.filter((s) => s.classId === cls.id).length;
                    return (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.subject}) - {count} Öğrenci
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1.5 font-bold text-slate-600">
                <span>Sırala:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                >
                  <option value="number">Okul No</option>
                  <option value="name">Adı</option>
                  <option value="surname">Soyadı</option>
                  <option value="class">Sınıf</option>
                </select>

                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                  title={sortOrder === 'asc' ? 'Artan Sıralama' : 'Azalan Sıralama'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar (Appears when students are selected) */}
          {selectedStudentIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-3 rounded-2xl shadow-md flex items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="bg-indigo-700 px-2 py-0.5 rounded-md">
                  {selectedStudentIds.length} Seçildi
                </span>
                <span>Toplu İşlem:</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkTransferOpen(true)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Sınıf Değiştir (Nakil)
                </button>

                <button
                  onClick={handleBulkDeleteSubmit}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sil
                </button>

                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="p-1.5 text-indigo-200 hover:text-white"
                  title="Seçimi Temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Student List Table Header */}
          <div className="flex items-center justify-between px-2 text-xs font-extrabold text-slate-500">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllStudents}
                className="flex items-center gap-1 text-indigo-600 hover:underline"
              >
                {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                    ? 'Tümünü Kaldır'
                    : 'Tümünü Seç'}
                </span>
              </button>
            </div>
            <span>Gösterilen: {filteredStudents.length} / Toplam {students.length}</span>
          </div>

          {/* Student Cards List */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-700 font-extrabold text-sm">
                {classes.length === 0
                  ? 'Henüz Tanımlanmış Bir Sınıfınız Yok'
                  : 'Kriterlere uygun öğrenci bulunamadı.'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {classes.length === 0
                  ? 'Öğrenci ekleyebilmek veya toplu liste yükleyebilmek için önce en az bir sınıf oluşturmalısınız.'
                  : 'Arama terimini değiştirin veya bu sınıfa yeni öğrenciler ekleyin.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {classes.length === 0 ? (
                  <button
                    onClick={onOpenAddClassModal}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> + İlk Sınıfınızı Ekleyin
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleOpenAddStudent}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Yeni Öğrenci Ekle
                    </button>
                    <button
                      onClick={onOpenBulkImport}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer"
                    >
                      Excel ile Yükle
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((std) => {
                const isSelected = selectedStudentIds.includes(std.id);
                const cls = classes.find((c) => c.id === std.classId);

                return (
                  <div
                    key={std.id}
                    className={`bg-white p-3 rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Left Info */}
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        onClick={() => handleToggleSelectStudent(std.id)}
                        className="mt-1 sm:mt-0 text-slate-400 hover:text-indigo-600 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs overflow-hidden">
                        {std.photoUrl ? (
                          <img
                            src={std.photoUrl}
                            alt={std.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          `#${std.number}`
                        )}
                      </div>

                      <div className="leading-tight space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {std.name} {std.surname}
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                            {cls ? cls.name : std.classId}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            No: {std.number}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="flex items-center gap-1">
                            👨‍👩‍👧 Veli: {std.parentName || 'Belirtilmedi'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 font-bold">
                            <Phone className="w-3 h-3 text-emerald-600" /> {std.parentPhone}
                          </span>
                        </div>

                        {std.notes && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold inline-block mt-0.5">
                            Not: {std.notes}
                          </div>
                        )}

                        {(() => {
                          const stdBadges = badges.filter((b) => b.studentId === std.id && isBadgeActive(b));
                          if (stdBadges.length === 0) return null;
                          return (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {stdBadges.map((b) => (
                                <span
                                  key={b.id}
                                  className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded font-black flex items-center gap-0.5"
                                  title={b.title}
                                >
                                  <span>{b.icon || '🏆'}</span>
                                  <span className="whitespace-nowrap">{b.title}</span>
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => {
                          setTransferringStudent(std);
                          setSingleTargetClassId('');
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1"
                        title="Sınıf Değiştir (Nakil)"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden md:inline">Nakil</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditStudent(std)}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden md:inline">Düzenle</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`${std.name} ${std.surname} öğrencisini silmek istediğinize emin misiniz?`)) {
                            onDeleteStudent(std.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLASS MANAGEMENT (Sınıf Yönetimi)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-3">
          {/* Header Controls for Classes */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Sınıf veya Branş Ara..."
                className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={onOpenAddClassModal}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" /> Yeni Sınıf Tanımla
            </button>
          </div>

          {/* Classes Cards Grid or Empty State */}
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-700 font-extrabold text-sm">
                {classes.length === 0
                  ? 'Henüz Tanımlanmış Bir Sınıfınız Bulunmuyor'
                  : 'Arama kriterine uygun sınıf bulunamadı.'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {classes.length === 0
                  ? 'Derslerinizi ve öğrencilerinizi organize etmek için ilk sınıfınızı hemen oluşturun.'
                  : 'Arama terimini değiştirin veya yeni bir sınıf oluşturun.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenAddClassModal}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + Yeni Sınıf Tanımla
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClasses.map((cls) => {
                const classStudents = students.filter((s) => s.classId === cls.id);
                const isSelected = selectedClassId === cls.id;

                return (
                  <div
                    key={cls.id}
                    className={`bg-white p-4 rounded-2xl border transition-all shadow-2xs space-y-3 relative ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-base flex items-center justify-center shadow-xs">
                          {cls.name}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            {cls.name}
                            {isSelected && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Aktif Seçili
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {cls.grade === 'Hazırlık' ? 'Hazırlık Sınıfı' : cls.grade === 'Mezun' ? 'Mezun (YKS)' : `${cls.grade}. Sınıf`} • {cls.subject}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                          {classStudents.length} Öğrenci
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">{cls.term}</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between text-slate-600">
                      <span>Oluşturulma Tarihi: {cls.createdAt || 'Sistem'}</span>
                      <button
                        onClick={() => {
                          onSelectClass(cls.id);
                          setActiveTab('students');
                          setFilterClassId(cls.id);
                        }}
                        className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Öğrencileri Göster →
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => handleDuplicateClass(cls)}
                        className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 py-1"
                        title="Bu sınıf yapısını kopyala"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" /> Çoğalt
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> Düzenle
                        </button>

                        <button
                          onClick={() => {
                            setDeletingClass(cls);
                            setDeleteClassOption('transfer');
                            setDeleteClassTargetId('');
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DIALOGS                                                         */}
      {/* ========================================================================= */}

      {/* 1. STUDENT EDIT / ADD MODAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                {editingStudent ? 'Öğrenci Bilgilerini Düzenle' : 'Sınıfa Yeni Öğrenci Ekle'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="space-y-3 text-xs">
              {/* Class Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ait Olduğu Sınıf</label>
                <select
                  value={stdClassId}
                  onChange={(e) => setStdClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50"
                  required
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Number, Name, Surname */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Okul No</label>
                  <input
                    type="text"
                    value={stdNumber}
                    onChange={(e) => setStdNumber(e.target.value)}
                    placeholder="101"
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adı</label>
                  <input
                    type="text"
                    value={stdName}
                    onChange={(e) => setStdName(e.target.value)}
                    placeholder="Ali"
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Soyadı</label>
                  <input
                    type="text"
                    value={stdSurname}
                    onChange={(e) => setStdSurname(e.target.value)}
                    placeholder="Yılmaz"
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Photo Area with Device Upload & Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs overflow-hidden">
                    {stdPhotoUrl ? (
                      <img src={stdPhotoUrl} alt="Öğrenci" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <span className="font-extrabold text-slate-800 text-xs block">Öğrenci Fotoğrafı</span>
                    <div className="flex flex-wrap gap-1.5">
                      <label className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingPhoto ? 'Yükleniyor...' : 'Cihazdan Fotoğraf Seç'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDevicePhotoUpload}
                          className="hidden"
                          disabled={isUploadingPhoto}
                        />
                      </label>

                      {stdPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setStdPhotoUrl('')}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    value={stdPhotoUrl}
                    onChange={(e) => setStdPhotoUrl(e.target.value)}
                    placeholder="https://... (veya cihazınızdan fotoğraf seçin)"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Parent Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-extrabold text-slate-800">Veli İletişim Bilgileri</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Veli Adı</label>
                    <input
                      type="text"
                      value={stdParentName}
                      onChange={(e) => setStdParentName(e.target.value)}
                      placeholder="Ahmet Yılmaz"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Veli GSM (Telefon)</label>
                    <input
                      type="tel"
                      value={stdParentPhone}
                      onChange={(e) => setStdParentPhone(e.target.value)}
                      placeholder="5551234567"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Öğretmen Özel Notu</label>
                <input
                  type="text"
                  value={stdNotes}
                  onChange={(e) => setStdNotes(e.target.value)}
                  placeholder="Burslu öğrenci, özel ders takibi vs..."
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingStudent ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CLASS EDIT MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-600" /> Sınıf Bilgilerini Düzenle
              </h3>
              <button
                onClick={() => setEditingClass(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClassEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sınıf Adı</label>
                <input
                  type="text"
                  value={clsName}
                  onChange={(e) => setClsName(e.target.value)}
                  placeholder="Örn: 9-A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sınıf Seviyesi</label>
                  <select
                    value={clsGrade}
                    onChange={(e) => setClsGrade(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Hazırlık">Hazırlık Sınıfı</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf (YKS)</option>
                    <option value="Mezun">Mezun (YKS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ders Branşı</label>
                  <input
                    type="text"
                    value={clsSubject}
                    onChange={(e) => setClsSubject(e.target.value)}
                    placeholder="Matematik"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dönem</label>
                <input
                  type="text"
                  value={clsTerm}
                  onChange={(e) => setClsTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CLASS DELETE WITH EDGE CASE OPTIONS MODAL */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
              <AlertTriangle className="w-5 h-5" /> Sınıfı Sil: {deletingClass.name}
            </div>

            {(() => {
              const count = students.filter((s) => s.classId === deletingClass.id).length;
              const otherClasses = classes.filter((c) => c.id !== deletingClass.id);

              return (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-700">
                    <strong>{deletingClass.name}</strong> sınıfını silmek üzeresiniz. Bu sınıfta kayıtlı{' '}
                    <strong className="text-indigo-600">{count} öğrenci</strong> bulunmaktadır.
                  </p>

                  {count > 0 && (
                    <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="font-bold text-slate-800 mb-1">
                        Bu sınıftaki öğrencilere ne yapılmasını istersiniz?
                      </div>

                      {otherClasses.length > 0 && (
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deleteOption"
                            checked={deleteClassOption === 'transfer'}
                            onChange={() => setDeleteClassOption('transfer')}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-900">Başka Bir Sınıfa Aktar (Önerilen)</span>
                            <p className="text-[11px] text-slate-500">
                              Öğrenciler silinmez, seçilen hedef sınıfa nakledilir.
                            </p>
                          </div>
                        </label>
                      )}

                      {deleteClassOption === 'transfer' && otherClasses.length > 0 && (
                        <div className="pl-6 pt-1">
                          <select
                            value={deleteClassTargetId}
                            onChange={(e) => setDeleteClassTargetId(e.target.value)}
                            className="w-full p-2 border border-indigo-200 bg-white font-bold text-indigo-900 rounded-lg"
                          >
                            <option value="">-- Hedef Sınıfı Seçin --</option>
                            {otherClasses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.subject})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-slate-200">
                        <input
                          type="radio"
                          name="deleteOption"
                          checked={deleteClassOption === 'delete'}
                          onChange={() => setDeleteClassOption('delete')}
                          className="mt-0.5 text-rose-600"
                        />
                        <div>
                          <span className="font-bold text-rose-700">Tüm Öğrencileri De Sil</span>
                          <p className="text-[11px] text-slate-500">
                            Sınıf ile birlikte bu {count} öğrenci de sistemden kalıcı olarak silinir.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setDeletingClass(null)}
                      className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleConfirmDeleteClass}
                      className="flex-1 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                    >
                      Sınıfı Sil
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 4. BULK TRANSFER MODAL */}
      {isBulkTransferOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Toplu Öğrenci Nakil / Transfer
            </div>

            <p className="text-xs text-slate-600">
              Seçilen <strong>{selectedStudentIds.length} öğrenciyi</strong> hangi hedef sınıfa aktarmak
              istiyorsunuz?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Sınıf:</label>
              <select
                value={bulkTargetClassId}
                onChange={(e) => setBulkTargetClassId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 font-bold rounded-xl text-xs"
              >
                <option value="">-- Hedef Sınıf Seçiniz --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.subject})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsBulkTransferOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                onClick={handleBulkTransferSubmit}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Aktarımı Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SINGLE STUDENT TRANSFER MODAL */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Öğrenci Nakil
            </div>

            <p className="text-xs text-slate-600">
              <strong>
                #{transferringStudent.number} {transferringStudent.name} {transferringStudent.surname}
              </strong>{' '}
              öğrencisini hangi hedef sınıfa taşımak istiyorsunuz?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Sınıf:</label>
              <select
                value={singleTargetClassId}
                onChange={(e) => setSingleTargetClassId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 font-bold rounded-xl text-xs"
              >
                <option value="">-- Hedef Sınıf Seçiniz --</option>
                {classes
                  .filter((c) => c.id !== transferringStudent.classId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subject})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setTransferringStudent(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                onClick={handleSingleTransferSubmit}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Nakli Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
