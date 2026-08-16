import React, { useState, useEffect } from 'react';
import { User, ClassRoom, Student } from '../types';
import { 
  getAllUserProfilesFromFirebase, 
  getTeacherDataForAdmin,
  saveUserProfileToFirebase,
  deleteUserProfileFromFirebase,
  saveClassToFirebase,
  deleteClassFromFirebase,
  saveStudentToFirebase,
  deleteStudentFromFirebase
} from '../services/firebaseSync';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  School, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Phone, 
  UserCheck, 
  Calendar, 
  ArrowLeft, 
  Loader2,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface TeacherManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

interface TeacherWithStats extends User {
  classes: ClassRoom[];
  students: Student[];
  isLoadingStats?: boolean;
}

export const TeacherManagementModal: React.FC<TeacherManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithStats | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'classes' | 'students'>('classes');
  const [selectedClassIdFilter, setSelectedClassIdFilter] = useState<string>('all');

  // Modals state for editing teacher, deleting teacher (3-step), editing class, editing student
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithStats | null>(null);

  // Delete Teacher 3-Step Confirmation State
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherWithStats | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Class Edit State
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);

  // Student Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load teachers list
  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUserProfilesFromFirebase();
      
      const initialTeachersList: TeacherWithStats[] = allUsers.map(u => ({
        ...u,
        classes: [],
        students: [],
        isLoadingStats: true,
      }));

      setTeachers(initialTeachersList);

      // Fetch stats for each teacher in background
      const updatedList = await Promise.all(
        allUsers.map(async (u) => {
          const teacherData = await getTeacherDataForAdmin(u.id, u.email);
          return {
            ...u,
            classes: teacherData.classes,
            students: teacherData.students,
            isLoadingStats: false,
          };
        })
      );

      setTeachers(updatedList);

      // Keep selected teacher state in sync if open
      if (selectedTeacher) {
        const found = updatedList.find(t => t.id === selectedTeacher.id || (t.email && t.email.toLowerCase() === selectedTeacher.email?.toLowerCase()));
        if (found) setSelectedTeacher(found);
      }
    } catch (err) {
      console.error('Error loading teachers for admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser.role === 'admin') {
      loadTeachers();
      setSelectedTeacher(null);
      setSearchQuery('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Security Gate
  if (currentUser.role !== 'admin' && currentUser.email?.toLowerCase() !== 'ccaqlayan@gmail.com') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Erişim Engellendi</h3>
          <p className="text-xs text-slate-600">Bu sayfayı yalnızca sistem yöneticisi (admin) görüntüleyebilir.</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Anladım
          </button>
        </div>
      </div>
    );
  }

  // Filter teachers by search query
  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.schoolName?.toLowerCase().includes(q)
    );
  });

  const getInitials = (fullName: string) => {
    if (!fullName) return 'Ö';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // -----------------------------------------------------------
  // HANDLERS FOR TEACHER
  // -----------------------------------------------------------
  const handleSelectTeacher = (teacher: TeacherWithStats) => {
    setSelectedTeacher(teacher);
    setActiveDetailTab('classes'); // Always open "Sınıfları" tab first as requested
    setSelectedClassIdFilter('all');
  };

  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      await saveUserProfileToFirebase(editingTeacher);
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? editingTeacher : t));
      if (selectedTeacher && selectedTeacher.id === editingTeacher.id) {
        setSelectedTeacher(editingTeacher);
      }
      showToast('Öğretmen profili başarıyla güncellendi.');
      setEditingTeacher(null);
    } catch (err) {
      console.error('Error saving teacher profile:', err);
      showToast('Profil güncellenirken hata oluştu.');
    }
  };

  const startDeleteTeacher = (teacher: TeacherWithStats) => {
    if (teacher.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
      showToast('Kendi admin hesabınızı silemezsiniz!');
      return;
    }
    setDeletingTeacher(teacher);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'SİL') return;

    try {
      await deleteUserProfileFromFirebase(deletingTeacher.id, deletingTeacher.email);
      setTeachers(prev => prev.filter(t => t.id !== deletingTeacher.id));
      if (selectedTeacher && selectedTeacher.id === deletingTeacher.id) {
        setSelectedTeacher(null);
      }
      showToast(`'${deletingTeacher.name}' hesabı kalıcı olarak silindi.`);
      setDeletingTeacher(null);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Error deleting teacher:', err);
      showToast('Öğretmen hesabı silinirken hata oluştu.');
    }
  };

  // -----------------------------------------------------------
  // HANDLERS FOR CLASS
  // -----------------------------------------------------------
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !editingClass) return;

    try {
      await saveClassToFirebase(selectedTeacher.id, editingClass);
      const updatedClasses = editingClass.id && selectedTeacher.classes.some(c => c.id === editingClass.id)
        ? selectedTeacher.classes.map(c => c.id === editingClass.id ? editingClass : c)
        : [...selectedTeacher.classes, editingClass];

      const updatedTeacher = { ...selectedTeacher, classes: updatedClasses };
      setSelectedTeacher(updatedTeacher);
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));

      showToast('Sınıf bilgisi kaydedildi.');
      setEditingClass(null);
      setIsAddingClass(false);
    } catch (err) {
      console.error('Error saving class:', err);
      showToast('Sınıf kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!selectedTeacher) return;
    if (!confirm('Bu sınıfı ve öğretmen paneline tanımlı ilişkilerini silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteClassFromFirebase(selectedTeacher.id, classId);
      const updatedClasses = selectedTeacher.classes.filter(c => c.id !== classId);
      const updatedStudents = selectedTeacher.students.filter(s => s.classId !== classId);
      const updatedTeacher = { ...selectedTeacher, classes: updatedClasses, students: updatedStudents };
      setSelectedTeacher(updatedTeacher);
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));

      showToast('Sınıf silindi.');
    } catch (err) {
      console.error('Error deleting class:', err);
      showToast('Sınıf silinirken hata oluştu.');
    }
  };

  // -----------------------------------------------------------
  // HANDLERS FOR STUDENT
  // -----------------------------------------------------------
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !editingStudent) return;

    try {
      await saveStudentToFirebase(selectedTeacher.id, editingStudent);
      const updatedStudents = editingStudent.id && selectedTeacher.students.some(s => s.id === editingStudent.id)
        ? selectedTeacher.students.map(s => s.id === editingStudent.id ? editingStudent : s)
        : [...selectedTeacher.students, editingStudent];

      const updatedTeacher = { ...selectedTeacher, students: updatedStudents };
      setSelectedTeacher(updatedTeacher);
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));

      showToast('Öğrenci bilgisi kaydedildi.');
      setEditingStudent(null);
      setIsAddingStudent(false);
    } catch (err) {
      console.error('Error saving student:', err);
      showToast('Öğrenci kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedTeacher) return;
    if (!confirm('Öğrenciyi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteStudentFromFirebase(selectedTeacher.id, studentId);
      const updatedStudents = selectedTeacher.students.filter(s => s.id !== studentId);
      const updatedTeacher = { ...selectedTeacher, students: updatedStudents };
      setSelectedTeacher(updatedTeacher);
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));

      showToast('Öğrenci silindi.');
    } catch (err) {
      console.error('Error deleting student:', err);
      showToast('Öğrenci silinirken hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col w-screen h-screen overflow-hidden text-slate-900 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FULL PAGE HEADER */}
      <header className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 px-4 sm:px-8 py-3.5 flex items-center justify-between text-white border-b border-indigo-900/60 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-indigo-950 flex items-center justify-center shadow-md font-black text-lg shrink-0">
            <ShieldCheck className="w-6 h-6 text-indigo-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">Öğretmen Yönetim Sayfası</h1>
              <span className="bg-amber-400 text-indigo-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                Admin Tam Sayfa
              </span>
            </div>
            <p className="text-[11px] text-indigo-200 font-medium hidden sm:block">
              Sistemdeki tüm öğretmen hesaplarını, sınıfları ve öğrencileri doğrudan düzenleyin veya yönetin.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadTeachers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/15"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
            <span>Paneli Kapat</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {selectedTeacher ? (
            /* ======================================================== */
            /* TEACHER DETAIL VIEW                                      */
            /* ======================================================== */
            <div className="space-y-6">
              
              {/* Top Navigation & Breadcrumb */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-extrabold text-xs transition-all cursor-pointer border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Öğretmen Listesine Dön
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400">Yönetim</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Öğretmenler</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold text-slate-900">{selectedTeacher.name}</span>
                </div>
              </div>

              {/* Teacher Summary & Action Bar */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {selectedTeacher.photoUrl ? (
                    <img
                      src={selectedTeacher.photoUrl}
                      alt={selectedTeacher.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                      {getInitials(selectedTeacher.name)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-slate-900">{selectedTeacher.name || 'Öğretmen'}</h2>
                      {selectedTeacher.role === 'admin' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                          🛡️ Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                          👨‍🏫 Öğretmen
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {selectedTeacher.email}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <strong>Branş:</strong> {selectedTeacher.subject || 'Belirtilmemiş'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        <strong>Okul:</strong> {selectedTeacher.schoolName || 'Belirtilmemiş'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Quick Action Buttons for Teacher */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => setEditingTeacher(selectedTeacher)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Profili Düzenle</span>
                  </button>

                  <button
                    onClick={() => startDeleteTeacher(selectedTeacher)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hesabı Sil</span>
                  </button>
                </div>
              </div>

              {/* SUB TABS HEADER: Sınıfları vs Öğrencileri */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveDetailTab('classes')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      activeDetailTab === 'classes'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Sınıfları ({selectedTeacher.classes.length})
                  </button>

                  <button
                    onClick={() => setActiveDetailTab('students')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      activeDetailTab === 'students'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Öğrencileri ({selectedTeacher.students.length})
                  </button>
                </div>

                {/* Tab specific action buttons */}
                {activeDetailTab === 'classes' ? (
                  <button
                    onClick={() => {
                      setEditingClass({
                        id: 'cls-' + Date.now(),
                        name: '',
                        subject: selectedTeacher.subject || '',
                        grade: '8',
                        term: '2025-2026',
                      });
                      setIsAddingClass(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Sınıf Ekle</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedTeacher.classes.length > 0 && (
                      <select
                        value={selectedClassIdFilter}
                        onChange={(e) => setSelectedClassIdFilter(e.target.value)}
                        className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      >
                        <option value="all">Tüm Sınıflar ({selectedTeacher.students.length} Öğrenci)</option>
                        {selectedTeacher.classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({selectedTeacher.students.filter(s => s.classId === cls.id).length} Öğrenci)
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => {
                        setEditingStudent({
                          id: 'std-' + Date.now(),
                          name: '',
                          surname: '',
                          number: '',
                          classId: selectedClassIdFilter !== 'all' ? selectedClassIdFilter : (selectedTeacher.classes[0]?.id || ''),
                          parentName: '',
                          parentPhone: '',
                          parentEmail: '',
                        });
                        setIsAddingStudent(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yeni Öğrenci Ekle</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SUB TAB CONTENT */}
              {activeDetailTab === 'classes' ? (
                /* CLASSES GRID */
                selectedTeacher.classes.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800">Henüz Sınıf Kaydı Yok</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Bu öğretmen hesabı altına yeni bir sınıf eklemek için yukarıdaki butonu kullanabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTeacher.classes.map((cls) => {
                      const classStudents = selectedTeacher.students.filter(s => s.classId === cls.id);
                      return (
                        <div
                          key={cls.id}
                          className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <span className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-2xs">
                                  {cls.grade || cls.name.slice(0, 2)}
                                </span>
                                <div>
                                  <h3 className="font-black text-base text-slate-900">{cls.name} Sınıfı</h3>
                                  <p className="text-xs text-slate-500 font-medium">{cls.subject || 'Branş Belirtilmemiş'}</p>
                                </div>
                              </div>

                              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {classStudents.length} Öğrenci
                              </span>
                            </div>

                            {cls.term && (
                              <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 pt-2 border-t border-slate-100">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                Dönem: {cls.term}
                              </div>
                            )}
                          </div>

                          {/* Class Card Action Buttons */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                setSelectedClassIdFilter(cls.id);
                                setActiveDetailTab('students');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Öğrencileri Gör ({classStudents.length})</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingClass(cls);
                                  setIsAddingClass(false);
                                }}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                title="Sınıfı Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClass(cls.id)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Sınıfı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* STUDENTS LIST / CARDS */
                selectedTeacher.students.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-extrabold text-slate-800">Henüz Kayıtlı Öğrenci Bulunmuyor</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Bu öğretmen hesabı altında öğrenci eklemek için yukarıdaki butonu kullanabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedClassIdFilter !== 'all' && (
                      <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl flex items-center justify-between text-indigo-950 text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <span>
                            Filtrelenen Sınıf: <strong>{selectedTeacher.classes.find(c => c.id === selectedClassIdFilter)?.name || 'Sınıf'}</strong>
                          </span>
                        </span>
                        <button
                          onClick={() => setSelectedClassIdFilter('all')}
                          className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl font-extrabold border border-indigo-200 cursor-pointer transition-all"
                        >
                          Tüm Sınıfları Göster
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {selectedTeacher.students
                        .filter(s => selectedClassIdFilter === 'all' || s.classId === selectedClassIdFilter)
                        .map((student) => {
                          const studentClass = selectedTeacher.classes.find(c => c.id === student.classId);
                          return (
                            <div
                              key={student.id}
                              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all space-y-3 flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {student.photoUrl ? (
                                    <img
                                      src={student.photoUrl}
                                      alt={student.name}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                                      #{student.number || 'No'}
                                    </div>
                                  )}

                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                        #{student.number || 'Yok'}
                                      </span>
                                      <h4 className="font-extrabold text-sm text-slate-900">
                                        {student.name} {student.surname}
                                      </h4>
                                    </div>

                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                      Sınıf: <strong className="text-slate-800">{studentClass ? studentClass.name : 'Genel'}</strong>
                                    </p>
                                  </div>
                                </div>

                                {/* Student Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingStudent(student);
                                      setIsAddingStudent(false);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                    title="Öğrenciyi Düzenle"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteStudent(student.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                    title="Öğrenciyi Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Parent Contact */}
                              {(student.parentName || student.parentPhone || student.parentEmail) && (
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                                  {student.parentName && (
                                    <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                      Veli: {student.parentName}
                                    </div>
                                  )}
                                  {student.parentPhone && (
                                    <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                      {student.parentPhone}
                                    </div>
                                  )}
                                  {student.parentEmail && (
                                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                                      {student.parentEmail}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            /* ======================================================== */
            /* TEACHERS LIST VIEW                                       */
            /* ======================================================== */
            <div className="space-y-6">
              
              {/* Top Search & Filter Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="İsim, e-posta, branş veya okul adı ile ara..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                      Sistemde <strong>{filteredTeachers.length}</strong> Öğretmen
                    </span>
                  </div>
                </div>
              </div>

              {/* Teachers Cards Grid */}
              {isLoading && teachers.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                  <h3 className="text-sm font-extrabold text-slate-700">Öğretmen Verileri Yükleniyor...</h3>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 space-y-3">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-extrabold text-slate-800">Öğretmen Bulunamadı</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Arama sorgunuza uygun kayıtlı öğretmen hesabı bulunamadı.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Header: Avatar, Name, Email, Role */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {teacher.photoUrl ? (
                              <img
                                src={teacher.photoUrl}
                                alt={teacher.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {getInitials(teacher.name)}
                              </div>
                            )}

                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-black text-sm text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                                  {teacher.name || 'Öğretmen'}
                                </h3>
                                {teacher.role === 'admin' && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded-md shrink-0">
                                    🛡️ Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {teacher.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Subject & School info */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 font-medium">
                          <div className="flex items-center gap-1.5 text-slate-700 truncate">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate"><strong>Branş:</strong> {teacher.subject || 'Belirtilmemiş'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 truncate">
                            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate"><strong>Okul:</strong> {teacher.schoolName || 'Belirtilmemiş'}</span>
                          </div>
                        </div>

                        {/* Stats Pills */}
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-100">
                            {teacher.isLoadingStats ? '...' : `${teacher.classes.length} Sınıf`}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-100">
                            {teacher.isLoadingStats ? '...' : `${teacher.students.length} Öğrenci`}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleSelectTeacher(teacher)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                        >
                          <span>Sınıfları Gör</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTeacher(teacher)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            title="Öğretmen Profilini Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => startDeleteTeacher(teacher)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Öğretmen Hesabını Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* EDIT TEACHER PROFILE MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Öğretmen Profilini Düzenle
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacherProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  value={editingTeacher.email || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branş / Ders</label>
                <input
                  type="text"
                  value={editingTeacher.subject || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                  placeholder="Örn: Fen Bilimleri, Matematik..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Okul Adı</label>
                <input
                  type="text"
                  value={editingTeacher.schoolName || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, schoolName: e.target.value })}
                  placeholder="Örn: Atatürk Ortaokulu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kullanıcı Rolü</label>
                <select
                  value={editingTeacher.role || 'teacher'}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, role: e.target.value as 'teacher' | 'admin' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="teacher">👨‍🏫 Standart Öğretmen</option>
                  <option value="admin">🛡️ Sistem Yöneticisi (Admin)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TEACHER 3-STEP CONFIRMATION MODAL */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-300 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-rose-600 uppercase tracking-wider">Aşama {deleteStep} / 3</span>
              <div className="flex gap-1.5">
                <span className={`w-6 h-2 rounded-full ${deleteStep >= 1 ? 'bg-rose-600' : 'bg-slate-200'}`} />
                <span className={`w-6 h-2 rounded-full ${deleteStep >= 2 ? 'bg-rose-600' : 'bg-slate-200'}`} />
                <span className={`w-6 h-2 rounded-full ${deleteStep >= 3 ? 'bg-rose-600' : 'bg-slate-200'}`} />
              </div>
            </div>

            {/* STEP 1 */}
            {deleteStep === 1 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-black">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-slate-900">1. Onay: Hesabı Silmek İstediğinize Emin Misiniz?</h3>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-900">{deletingTeacher.name}</strong> ({deletingTeacher.email}) öğretmen hesabı sistemden kaldırılacaktır.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => setDeletingTeacher(null)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md"
                  >
                    1. Onayı Ver ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {deleteStep === 2 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-black">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-black text-slate-900">2. Onay: Tüm İlişkili Veriler Etkilenecektir!</h3>
                  <p className="text-xs text-slate-600 bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                    Bu öğretmene ait <strong>{deletingTeacher.classes.length} sınıf</strong> ve <strong>{deletingTeacher.students.length} öğrenci</strong> kaydı silinecektir. Bu işlem geri alınamaz.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs"
                  >
                    Geri
                  </button>
                  <button
                    onClick={() => setDeleteStep(3)}
                    className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md"
                  >
                    2. Onayı Ver ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {deleteStep === 3 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto font-black shadow-lg">
                  <Trash2 className="w-7 h-7" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-black text-slate-900">3. Ve Son Onay: Güvenlik Doğrulaması</h3>
                  <p className="text-xs text-slate-600">
                    Hesabı kalıcı olarak silmeyi onaylamak için lütfen aşağıdaki kutucuğa büyük harflerle <strong className="text-rose-600 font-mono">SİL</strong> yazın:
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="SİL yazın..."
                    className="w-full text-center font-mono text-base font-black tracking-widest px-3 py-2.5 border-2 border-rose-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => setDeletingTeacher(null)}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs"
                  >
                    İptal
                  </button>
                  <button
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'SİL'}
                    onClick={handleConfirmDeleteTeacher}
                    className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-lg transition-all"
                  >
                    🔴 KALICI OLARAK SİL
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* EDIT / ADD CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                {isAddingClass ? 'Yeni Sınıf Ekle' : 'Sınıf Bilgilerini Düzenle'}
              </h3>
              <button onClick={() => setEditingClass(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sınıf Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 8-A"
                  value={editingClass.name || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branş / Ders</label>
                <input
                  type="text"
                  placeholder="Örn: Fen Bilimleri"
                  value={editingClass.subject || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sınıf Seviyesi</label>
                <input
                  type="text"
                  placeholder="Örn: 8. Sınıf"
                  value={editingClass.grade || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Eğitim Dönemi</label>
                <input
                  type="text"
                  placeholder="Örn: 2025-2026"
                  value={editingClass.term || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, term: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / ADD STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                {isAddingStudent ? 'Yeni Öğrenci Ekle' : 'Öğrenci Bilgilerini Düzenle'}
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ad</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Soyad</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.surname || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, surname: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Okul No</label>
                  <input
                    type="text"
                    placeholder="Örn: 104"
                    value={editingStudent.number || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sınıf Seçimi</label>
                  <select
                    value={editingStudent.classId || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {selectedTeacher?.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Veli Adı Soyadı</label>
                <input
                  type="text"
                  placeholder="Örn: Mehmet Yılmaz"
                  value={editingStudent.parentName || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Veli Telefonu</label>
                <input
                  type="text"
                  placeholder="Örn: 0555 123 45 67"
                  value={editingStudent.parentPhone || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Veli E-postası</label>
                <input
                  type="email"
                  placeholder="Örn: veli@example.com"
                  value={editingStudent.parentEmail || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
