import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Star,
  Zap,
  BookOpen,
  Award,
  TrendingUp,
  Heart,
  X,
  Plus,
  Printer,
  Sparkles,
  User,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Building2,
  Edit3,
  Clock,
  Check,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Crown,
  Settings
} from 'lucide-react';
import { Student, StudentBadge, BadgeType, ClassRoom, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, BadgeDefinition } from '../types';
import { BADGE_DEFINITIONS } from '../mockData';
import { calculateBadgeExpiration, isBadgeActive, getBadgeRemainingDays } from '../utils/badgeUtils';

interface BadgeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  students: Student[];
  badges: StudentBadge[];
  badgeDefinitions?: BadgeDefinition[];
  onUpdateBadgeDefinitions?: (defs: BadgeDefinition[]) => void;
  onAwardBadge: (badge: StudentBadge) => void;
  onDeleteBadge: (badgeId: string) => void;
  plusMinusLogs: PerformanceLog[];
  quizzes: QuizScore[];
  homeworkRecords: HomeworkRecord[];
  notebookControls: NotebookControl[];
  teacherName?: string;
  schoolName?: string;
}

export const BadgeManagementModal: React.FC<BadgeManagementModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onSelectClass,
  students,
  badges,
  badgeDefinitions,
  onUpdateBadgeDefinitions,
  onAwardBadge,
  onDeleteBadge,
  plusMinusLogs,
  quizzes,
  homeworkRecords,
  notebookControls,
  teacherName = 'Branş Öğretmeni',
  schoolName = 'Atatürk Ortaokulu'
}) => {
  if (!isOpen) return null;

  const currentBadgeDefs = badgeDefinitions || BADGE_DEFINITIONS;

  const [activeTab, setActiveTab] = useState<'award' | 'templates' | 'certificate'>('award');
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const classBadges = badges.filter((b) => b.classId === selectedClassId || classStudents.some((s) => s.id === b.studentId));

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(classStudents[0]?.id || '');
  const [selectedBadgeType, setSelectedBadgeType] = useState<BadgeType>(currentBadgeDefs[0]?.type || 'star_of_week');
  const [badgeNote, setBadgeNote] = useState('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [editingBadge, setEditingBadge] = useState<StudentBadge | null>(null);

  // Definition Editor State
  const [editingDefinition, setEditingDefinition] = useState<BadgeDefinition | null>(null);
  const [isNewDefModalOpen, setIsNewDefModalOpen] = useState<boolean>(false);
  const [defFormTitle, setDefFormTitle] = useState('');
  const [defFormDesc, setDefFormDesc] = useState('');
  const [defFormIcon, setDefFormIcon] = useState('Trophy');
  const [defFormTheme, setDefFormTheme] = useState('amber');

  const THEME_OPTIONS = [
    { id: 'amber', name: 'Kehribar / Altın Sarı', color: 'text-amber-500', bgColor: 'bg-amber-500/10 text-amber-700', borderColor: 'border-amber-200' },
    { id: 'indigo', name: 'İndigo / Gece Mavisi', color: 'text-indigo-600', bgColor: 'bg-indigo-50 text-indigo-700', borderColor: 'border-indigo-200' },
    { id: 'emerald', name: 'Zümrüt Yeşili', color: 'text-emerald-600', bgColor: 'bg-emerald-50 text-emerald-700', borderColor: 'border-emerald-200' },
    { id: 'purple', name: 'Kraliyet Moru', color: 'text-purple-600', bgColor: 'bg-purple-50 text-purple-700', borderColor: 'border-purple-200' },
    { id: 'blue', name: 'Gök Mavisi', color: 'text-blue-600', bgColor: 'bg-blue-50 text-blue-700', borderColor: 'border-blue-200' },
    { id: 'rose', name: 'Pembe / Kırmızı', color: 'text-rose-600', bgColor: 'bg-rose-50 text-rose-700', borderColor: 'border-rose-200' },
  ];

  const ICON_OPTIONS = [
    { id: 'Trophy', label: 'Kupa 🏆' },
    { id: 'Star', label: 'Yıldız ⭐' },
    { id: 'Zap', label: 'Şimşek ⚡' },
    { id: 'BookOpen', label: 'Kitap 📖' },
    { id: 'Award', label: 'Madalya 🏅' },
    { id: 'TrendingUp', label: 'Gelişim 📈' },
    { id: 'Heart', label: 'Kalp ❤️' },
    { id: 'ShieldCheck', label: 'Kalkan 🛡️' },
    { id: 'Crown', label: 'Taç 👑' },
    { id: 'Sparkles', label: 'Işıltı ✨' },
  ];

  const openNewDefModal = () => {
    setDefFormTitle('');
    setDefFormDesc('');
    setDefFormIcon('Trophy');
    setDefFormTheme('amber');
    setEditingDefinition(null);
    setIsNewDefModalOpen(true);
  };

  const openEditDefModal = (def: BadgeDefinition) => {
    setEditingDefinition(def);
    setDefFormTitle(def.title);
    setDefFormDesc(def.description);
    setDefFormIcon(def.iconName);
    const matched = THEME_OPTIONS.find((t) => t.color === def.color) || THEME_OPTIONS[0];
    setDefFormTheme(matched.id);
    setIsNewDefModalOpen(true);
  };

  const handleSaveDefinition = () => {
    if (!defFormTitle.trim()) return;

    const themeStyle = THEME_OPTIONS.find((t) => t.id === defFormTheme) || THEME_OPTIONS[0];

    if (editingDefinition) {
      const updated = currentBadgeDefs.map((d) =>
        d.type === editingDefinition.type
          ? {
              ...d,
              title: defFormTitle.trim(),
              description: defFormDesc.trim() || d.description,
              iconName: defFormIcon,
              color: themeStyle.color,
              bgColor: themeStyle.bgColor,
              borderColor: themeStyle.borderColor,
            }
          : d
      );
      onUpdateBadgeDefinitions?.(updated);
    } else {
      const newType = `custom_${Date.now()}`;
      const newDef: BadgeDefinition = {
        id: `def-${Date.now()}`,
        type: newType,
        title: defFormTitle.trim(),
        description: defFormDesc.trim() || 'Özel tanımlanmış başarı rozeti.',
        iconName: defFormIcon,
        color: themeStyle.color,
        bgColor: themeStyle.bgColor,
        borderColor: themeStyle.borderColor,
        isCustom: true,
      };
      const updated = [...currentBadgeDefs, newDef];
      onUpdateBadgeDefinitions?.(updated);
    }

    setIsNewDefModalOpen(false);
    setEditingDefinition(null);
  };

  const handleDeleteDefinition = (typeToDelete: string) => {
    if (window.confirm('Bu rozet türünü silmek istediğinizden emin misiniz?\n\nNot: Bu türü silmek önceden öğrencilere verilmiş rozetleri SİLMEZ ve ETKİLEMEZ.')) {
      const updated = currentBadgeDefs.filter((d) => d.type !== typeToDelete);
      onUpdateBadgeDefinitions?.(updated);
      if (selectedBadgeType === typeToDelete && updated[0]) {
        setSelectedBadgeType(updated[0].type);
      }
    }
  };

  // Recommendation & Criteria State
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState<boolean>(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState<boolean>(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState<boolean>(false);

  // Criteria thresholds (customizable)
  const [criteria, setCriteria] = useState({
    minHomeworkCount: 5,         // Min 5 ödev
    minHomeworkCompletion: 100,  // %100 tamamlanma
    minNotebookScore: 95,        // %95 defter notu
    minClassLeaderPluses: 8,     // Min 8 artı
    minQuizScore: 90,            // Min 90 puan quiz
  });

  // Certificate State
  const [certStudentId, setCertStudentId] = useState<string>(classStudents[0]?.id || '');
  const [certBadgeId, setCertBadgeId] = useState<string>('');

  const currentStudentForCert = classStudents.find((s) => s.id === certStudentId) || classStudents[0];
  const studentCertBadges = classBadges.filter((b) => b.studentId === certStudentId);
  const selectedCertBadge = studentCertBadges.find((b) => b.id === certBadgeId) || studentCertBadges[0] || classBadges[0];

  // Helper function to render badge icon
  const renderBadgeIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'ShieldCheck':
      case 'Shield':
        return <ShieldCheck className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  // Automatic badge candidate suggestions based on statistics
  const getBadgeCandidates = () => {
    const candidates: { student: Student; badgeType: BadgeType; reason: string }[] = [];

    classStudents.forEach((student) => {
      // 1. Ödev Ustası (Homework Master)
      const studentHws = homeworkRecords.filter((h) => h.studentId === student.id);
      const doneHws = studentHws.filter((h) => h.status === 'completed' || h.status === 'done');
      if (studentHws.length >= criteria.minHomeworkCount) {
        const pct = Math.round((doneHws.length / studentHws.length) * 100);
        if (pct >= criteria.minHomeworkCompletion) {
          if (!classBadges.some((b) => b.studentId === student.id && b.badgeType === 'homework_master')) {
            candidates.push({
              student,
              badgeType: 'homework_master',
              reason: `Son ${studentHws.length} ödevin %${pct}'ini (${doneHws.length}/${studentHws.length}) tam teslim etti.`,
            });
          }
        }
      }

      // 2. Defter Profesyoneli (Notebook Pro)
      const studentNbs = notebookControls.filter((n) => n.studentId === student.id && !n.isDeleted);
      if (studentNbs.length > 0) {
        const avgNb = studentNbs.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / studentNbs.length;
        if (avgNb >= criteria.minNotebookScore) {
          if (!classBadges.some((b) => b.studentId === student.id && b.badgeType === 'notebook_pro')) {
            candidates.push({
              student,
              badgeType: 'notebook_pro',
              reason: `Defter kontrolleri ortalaması %${Math.round(avgNb)} (Kriter: ≥%${criteria.minNotebookScore}).`,
            });
          }
        }
      }

      // 3. Ders Lideri / Örnek Katılım (Class Leader)
      const studentPluses = plusMinusLogs.filter((p) => p.studentId === student.id && p.type === 'plus' && !p.isDeleted);
      const studentMinuses = plusMinusLogs.filter((p) => p.studentId === student.id && p.type === 'minus' && !p.isDeleted);
      if (studentPluses.length >= criteria.minClassLeaderPluses && studentMinuses.length === 0) {
        if (!classBadges.some((b) => b.studentId === student.id && b.badgeType === 'class_leader')) {
          candidates.push({
            student,
            badgeType: 'class_leader',
            reason: `0 eksi ve ${studentPluses.length} artı ile derse örnek katılım gösterdi.`,
          });
        }
      }

      // 4. Sınav Şampiyonu / Haftanın Yıldızı (Star of Week)
      const studentQuizzes = quizzes.filter((q) => q.studentId === student.id);
      if (studentQuizzes.length > 0) {
        const avgQuiz = studentQuizzes.reduce((acc, curr) => acc + (curr.score || 0), 0) / studentQuizzes.length;
        if (avgQuiz >= criteria.minQuizScore) {
          if (!classBadges.some((b) => b.studentId === student.id && b.badgeType === 'star_of_week')) {
            candidates.push({
              student,
              badgeType: 'star_of_week',
              reason: `Sınav/Quiz ortalaması ${Math.round(avgQuiz)} puan (Kriter: ≥${criteria.minQuizScore}).`,
            });
          }
        }
      }
    });

    return candidates;
  };

  const badgeCandidates = getBadgeCandidates();

  // Award Badge Action
  const handleAward = (studentId?: string, badgeType?: BadgeType, noteText?: string) => {
    const targetStudentId = studentId || selectedStudentId;
    const targetBadgeType = badgeType || selectedBadgeType;

    if (!targetStudentId) return;

    const def = currentBadgeDefs.find((d) => d.type === targetBadgeType) || currentBadgeDefs[0] || BADGE_DEFINITIONS[0];
    const todayStr = new Date().toISOString().slice(0, 10);
    const expiresAtStr = calculateBadgeExpiration(todayStr, durationDays);

    const newBadge: StudentBadge = {
      id: `bdg-${Date.now()}`,
      studentId: targetStudentId,
      classId: selectedClassId,
      badgeType: targetBadgeType,
      title: def.title,
      description: def.description,
      iconName: def.iconName,
      icon: '🏆',
      awardedAt: todayStr,
      awardedBy: teacherName,
      durationDays: durationDays,
      expiresAt: expiresAtStr,
      note: noteText || badgeNote || 'Ders başarısı ve örnek davranışı sebebiyle takdir edildi.',
    };

    onAwardBadge(newBadge);
    setBadgeNote('');
  };

  const handleSaveEditBadge = () => {
    if (!editingBadge) return;
    const expiresAtStr = calculateBadgeExpiration(editingBadge.awardedAt, editingBadge.durationDays || 0);
    const updatedBadge: StudentBadge = {
      ...editingBadge,
      expiresAt: expiresAtStr,
    };
    onAwardBadge(updatedBadge);
    setEditingBadge(null);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <Trophy className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Başarı Rozetleri & Onur Belgesi Modülü
                <span className="text-xs bg-amber-400/30 text-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/30 font-medium">
                  Gamification Engine
                </span>
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                Öğrencilere dijital rozet tanımlayın, otomatik başarı analizleri yapın ve başarı belgesi yazdırın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Class Selection & Tab Navigation Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Sınıf:</span>
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs focus:outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="flex border border-slate-200 rounded-xl bg-slate-200/60 p-0.5 font-semibold">
            <button
              onClick={() => setActiveTab('award')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'award' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Rozet Yönetimi & Sınıf Panosu</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'templates' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-600" />
              <span>Rozet Türlerini Yönet ({currentBadgeDefs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'certificate' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>A4 / A5 Başarı Belgesi Yazdır</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-white">
          {activeTab === 'award' ? (
            <div className="space-y-6">
              {/* Automatic Badge Recommendations Section */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-100/40 border border-amber-300/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold shrink-0 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          Otomatik Rozet Önerileri
                        </h4>
                        <span className="text-[10px] font-extrabold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                          {badgeCandidates.length} Öğrenci Hak Kazandı
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        Performans istatistiklerine göre otomatik rozet kriterleri
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCriteriaModalOpen(true)}
                      className="px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kriterleri Ayarla</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRecommendationsOpen(!isRecommendationsOpen)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    >
                      {isRecommendationsOpen ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span>Gizle</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>Görüntüle ({badgeCandidates.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isRecommendationsOpen && (
                  <div className="p-4 space-y-3 border-t border-amber-200/80 bg-white/70">
                    {badgeCandidates.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                        Mevcut kriterlere göre henüz yeni rozet önerisi bulunmuyor. Kriterleri düşürmek için "Kriterleri Ayarla" butonuna basabilirsiniz.
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                          <span>
                            {showAllRecommendations
                              ? `Tüm ${badgeCandidates.length} öneri listeleniyor:`
                              : `İlk 3 öneri gösteriliyor (Toplam ${badgeCandidates.length} öneri):`}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {(showAllRecommendations ? badgeCandidates : badgeCandidates.slice(0, 3)).map((cand, idx) => {
                            const badgeDef = currentBadgeDefs.find((d) => d.type === cand.badgeType);
                            return (
                              <div
                                key={idx}
                                className="p-3 bg-white border border-amber-200 hover:border-amber-400 rounded-xl shadow-2xs flex flex-col justify-between gap-2.5 text-xs transition-all"
                              >
                                <div>
                                  <div className="flex items-center gap-2 font-bold text-slate-900">
                                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                                      {renderBadgeIcon(badgeDef?.iconName || 'Award', 'w-4 h-4')}
                                    </span>
                                    <span className="truncate">{cand.student.name} {cand.student.surname}</span>
                                  </div>
                                  <p className="text-[11px] text-amber-950 font-medium mt-1.5">
                                    <strong>{badgeDef?.title}:</strong> {cand.reason}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAward(cand.student.id, cand.badgeType, cand.reason)}
                                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Rozeti Ver ve Tebrik Et</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {badgeCandidates.length > 3 && (
                          <div className="text-center pt-2 border-t border-amber-200/50">
                            <button
                              type="button"
                              onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                              className="text-xs font-black text-amber-800 hover:text-amber-950 underline cursor-pointer"
                            >
                              {showAllRecommendations
                                ? '▲ Sadece İlk 3 Öneriyi Göster'
                                : `▼ Tüm Önerileri Göster (${badgeCandidates.length} Öneri)`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Award Custom Badge Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Öğrenciye Özel Rozet Tanımla</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Öğrenci Seçin:</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl p-2 focus:outline-hidden"
                    >
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          No: {s.number} - {s.name} {s.surname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Rozet Türü:</label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('templates')}
                        className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                      >
                        + Tür Düzenle / Ekle
                      </button>
                    </div>
                    <select
                      value={selectedBadgeType}
                      onChange={(e) => setSelectedBadgeType(e.target.value as BadgeType)}
                      className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl p-2 focus:outline-hidden"
                    >
                      {currentBadgeDefs.map((def) => (
                        <option key={def.type} value={def.type}>
                          {def.title} - ({def.description})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kalma Süresi (Varsayılan 1 Hafta):</label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl p-2 focus:outline-hidden cursor-pointer"
                    >
                      <option value={7}>1 Hafta (7 Gün)</option>
                      <option value={14}>2 Hafta (14 Gün)</option>
                      <option value={30}>1 Ay (30 Gün)</option>
                      <option value={0}>Süresiz / Kalıcı (0 Gün)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Özel Not / Takdir Cümlesi:</label>
                    <input
                      type="text"
                      value={badgeNote}
                      onChange={(e) => setBadgeNote(e.target.value)}
                      placeholder="Örn: Hafta sonu ödevindeki üstün gayreti için"
                      className="w-full font-medium text-slate-800 bg-white border border-slate-200 rounded-xl p-2 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleAward()}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Rozeti Öğrenciye Ver (Süreli)</span>
                  </button>
                </div>
              </div>

              {/* Class Earned Badges Board */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Sınıf Kazanılan Rozetler Panosu ({classBadges.length} Rozet)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Süresi dolan rozetler de düzenlenebilir
                  </span>
                </h3>

                {classBadges.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl p-6">
                    <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Bu sınıfta henüz tanımlanmış rozet bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {classBadges.map((badge) => {
                      const student = students.find((s) => s.id === badge.studentId);
                      const badgeDef = currentBadgeDefs.find((d) => d.type === badge.badgeType);
                      const active = isBadgeActive(badge);
                      const remaining = getBadgeRemainingDays(badge);

                      return (
                        <div
                          key={badge.id}
                          className={`p-3.5 bg-white border hover:border-amber-300 rounded-2xl shadow-2xs flex flex-col justify-between gap-2 text-xs relative group transition-all ${
                            active ? 'border-amber-200' : 'border-slate-200 opacity-80'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl border shrink-0 ${badgeDef?.bgColor || 'bg-amber-50'} ${badgeDef?.borderColor || 'border-amber-200'}`}>
                              {renderBadgeIcon(badge.iconName, 'w-6 h-6')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <div className="font-extrabold text-slate-900 text-sm truncate">{badge.title}</div>
                                {active ? (
                                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-300 shrink-0">
                                    Aktif {remaining !== null ? `(${remaining}g)` : '(Kalıcı)'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0">
                                    Süresi Doldu
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-indigo-700 mt-0.5 truncate">
                                {student ? `${student.name} ${student.surname}` : 'Öğrenci'} ({student?.number})
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2">{badge.note || badge.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                            <span>Veriliş: {badge.awardedAt} {badge.expiresAt ? `(Bitiş: ${badge.expiresAt})` : ''}</span>
                            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingBadge(badge)}
                                className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 cursor-pointer"
                                title="Rozeti Düzenle"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Düzenle</span>
                              </button>
                              <button
                                onClick={() => onDeleteBadge(badge.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 cursor-pointer"
                                title="Rozeti Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Sil</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'templates' ? (
            /* TAB 2: ROZET TÜRLERİ & ŞABLON YÖNETİMİ */
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="bg-gradient-to-r from-blue-500/10 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Rozet Türleri, İsimleri ve Şablon Yönetimi</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Sistemde tanımlı rozetlerin isimlerini, açıklamalarını ve simgelerini düzenleyebilir, sınıflarınız için yeni özel rozet türleri tanımlayabilirsiniz.
                    </p>
                    <div className="mt-1.5 text-[11px] font-bold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200/80 inline-block">
                      🔒 Düzenleme veya silme yapmanız, geçmişte öğrencilere verilmiş rozet kayıtlarını ETKİLEMEZ.
                    </div>
                  </div>
                </div>

                <button
                  onClick={openNewDefModal}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Rozet Türü Ekle</span>
                </button>
              </div>

              {/* Grid of Badge Definitions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentBadgeDefs.map((def) => (
                  <div
                    key={def.type}
                    className={`p-4 rounded-2xl border ${def.borderColor || 'border-slate-200'} ${def.bgColor || 'bg-slate-50'} flex flex-col justify-between gap-3 relative group transition-all shadow-2xs hover:shadow-md`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2.5 rounded-xl bg-white shadow-2xs ${def.color || 'text-amber-600'} border border-slate-100`}>
                            {renderBadgeIcon(def.iconName, 'w-5 h-5')}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-sm text-slate-900">{def.title}</h5>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                              Kod: {def.type}
                            </span>
                          </div>
                        </div>
                        {def.isCustom && (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            Özel Rozet
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">
                        {def.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200/60">
                      <button
                        onClick={() => openEditDefModal(def)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>İsmi Düzenle</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDefinition(def.type)}
                        className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Bu rozet türünü sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB 2: PRINTABLE CERTIFICATE OF ACHIEVEMENT */
            <div className="space-y-4">
              {/* Controls Bar for Certificate */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Öğrenci:</span>
                    <select
                      value={certStudentId}
                      onChange={(e) => {
                        setCertStudentId(e.target.value);
                        const stdBadges = classBadges.filter((b) => b.studentId === e.target.value);
                        if (stdBadges.length > 0) setCertBadgeId(stdBadges[0].id);
                      }}
                      className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                    >
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.number} - {s.name} {s.surname}
                        </option>
                      ))}
                    </select>
                  </div>

                  {studentCertBadges.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Rozet:</span>
                      <select
                        value={certBadgeId || studentCertBadges[0]?.id}
                        onChange={(e) => setCertBadgeId(e.target.value)}
                        className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                      >
                        {studentCertBadges.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} ({b.awardedAt})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Başarı Belgesini Yazdır</span>
                </button>
              </div>

              {/* Printable Certificate Box */}
              <div className="p-8 sm:p-12 border-8 border-double border-amber-600/60 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 rounded-xl text-center relative max-w-3xl mx-auto shadow-lg printable-certificate">
                {/* Decorative Corner Ornaments */}
                <div className="absolute top-3 left-3 text-amber-600 opacity-60">✦ ✦ ✦</div>
                <div className="absolute top-3 right-3 text-amber-600 opacity-60">✦ ✦ ✦</div>
                <div className="absolute bottom-3 left-3 text-amber-600 opacity-60">✦ ✦ ✦</div>
                <div className="absolute bottom-3 right-3 text-amber-600 opacity-60">✦ ✦ ✦</div>

                <div className="text-xs font-bold text-amber-800 uppercase tracking-widest">{schoolName}</div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight uppercase mt-2">
                  BAŞARI VE ONUR BELGESİ
                </h1>
                <div className="w-24 h-1 bg-amber-500 mx-auto my-3 rounded-full"></div>

                <p className="text-xs text-slate-600 font-medium">Bu belge,</p>

                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-4 tracking-wide font-serif">
                  {currentStudentForCert?.name} {currentStudentForCert?.surname}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-lg mx-auto font-medium">
                  {currentClass?.name} sınıfındaki <strong>{currentClass?.subject}</strong> dersinde göstermiş olduğu üstün başarı, örnek tutum ve{' '}
                  <strong className="text-amber-900">"{selectedCertBadge?.title || 'Örnek Başarı'}"</strong> unvanına hak kazanmasından dolayı takdir edilerek verilmiştir.
                </p>

                {/* Badge Seal Display */}
                <div className="my-6 flex justify-center">
                  <div className="p-4 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-xl border-4 border-white flex flex-col items-center justify-center w-24 h-24">
                    {renderBadgeIcon(selectedCertBadge?.iconName || 'Trophy', 'w-8 h-8')}
                    <span className="text-[10px] font-black uppercase mt-1 tracking-tighter">GURUR BELGESİ</span>
                  </div>
                </div>

                {/* Date & Signatures */}
                <div className="mt-8 pt-4 border-t border-amber-200 grid grid-cols-2 text-xs">
                  <div>
                    <p className="text-slate-500">Tarih</p>
                    <p className="font-bold text-slate-800 mt-1">{selectedCertBadge?.awardedAt || new Date().toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{teacherName}</p>
                    <p className="text-slate-500 text-[11px]">{currentClass?.subject} Öğretmeni</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Rozetler öğrenci karnesine ve veli özet raporuna otomatik entegre olur.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

        {/* Edit Badge Sub-Modal */}
        {editingBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Verilen Rozeti Düzenle</span>
                </h3>
                <button
                  onClick={() => setEditingBadge(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rozet Unvanı / Başlık:</label>
                  <input
                    type="text"
                    value={editingBadge.title}
                    onChange={(e) => setEditingBadge({ ...editingBadge, title: e.target.value })}
                    className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Özel Not / Takdir Cümlesi:</label>
                  <input
                    type="text"
                    value={editingBadge.note || ''}
                    onChange={(e) => setEditingBadge({ ...editingBadge, note: e.target.value })}
                    className="w-full font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kalma Süresi (Gün):</label>
                  <select
                    value={editingBadge.durationDays !== undefined ? editingBadge.durationDays : 7}
                    onChange={(e) => setEditingBadge({ ...editingBadge, durationDays: Number(e.target.value) })}
                    className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value={7}>1 Hafta (7 Gün)</option>
                    <option value={14}>2 Hafta (14 Gün)</option>
                    <option value={30}>1 Ay (30 Gün)</option>
                    <option value={0}>Süresiz / Kalıcı (0 Gün)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Veriliş Tarihi:</label>
                  <input
                    type="date"
                    value={editingBadge.awardedAt}
                    onChange={(e) => setEditingBadge({ ...editingBadge, awardedAt: e.target.value })}
                    className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setEditingBadge(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveEditBadge}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Güncelle &amp; Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Criteria Settings Sub-Modal */}
        {isCriteriaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Otomatik Rozet Öneri Kriterleri</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                Sistem, öğrencilerin istatistiklerini bu eşik değerlere göre tarayarak rozet önerisi oluşturur. Değerleri yükselterek öneri sayısını azaltabilirsiniz.
              </p>

              <div className="space-y-3 text-xs">
                {/* 1. Homework */}
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ödev Ustası Kriterleri</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">Min. Ödev Sayısı:</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={criteria.minHomeworkCount}
                        onChange={(e) => setCriteria({ ...criteria, minHomeworkCount: Math.max(1, Number(e.target.value)) })}
                        className="w-full font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">Min. Tamamlama (%):</label>
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={criteria.minHomeworkCompletion}
                        onChange={(e) => setCriteria({ ...criteria, minHomeworkCompletion: Math.min(100, Math.max(50, Number(e.target.value))) })}
                        className="w-full font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Notebook */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Defter Profesyoneli Kriteri</span>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Min. Defter Kontrol Ortalama Notu (%):</label>
                    <input
                      type="number"
                      min={60}
                      max={100}
                      value={criteria.minNotebookScore}
                      onChange={(e) => setCriteria({ ...criteria, minNotebookScore: Math.min(100, Math.max(60, Number(e.target.value))) })}
                      className="w-full font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* 3. Class Leader */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ders Lideri (0 Eksi Şartı)</span>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Min. Artı Sayısı (Sıfır Eksi İle):</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={criteria.minClassLeaderPluses}
                      onChange={(e) => setCriteria({ ...criteria, minClassLeaderPluses: Math.max(1, Number(e.target.value)) })}
                      className="w-full font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* 4. Quiz */}
                <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2">
                  <div className="font-bold text-sky-950 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-sky-600" />
                    <span>Sınav Şampiyonu Kriteri</span>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Min. Sınav/Quiz Ortalama Puanı:</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={criteria.minQuizScore}
                      onChange={(e) => setCriteria({ ...criteria, minQuizScore: Math.min(100, Math.max(50, Number(e.target.value))) })}
                      className="w-full font-bold bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setCriteria({
                      minHomeworkCount: 5,
                      minHomeworkCompletion: 100,
                      minNotebookScore: 95,
                      minClassLeaderPluses: 8,
                      minQuizScore: 90,
                    })
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sıfırla</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Kriterleri Uygula ({badgeCandidates.length} Öneri Olacak)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Badge Definition Modal */}
        {isNewDefModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>{editingDefinition ? 'Rozet Türünü Düzenle' : 'Yeni Rozet Türü Tanımla'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewDefModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rozet Adı / Unvanı:</label>
                  <input
                    type="text"
                    value={defFormTitle}
                    onChange={(e) => setDefFormTitle(e.target.value)}
                    placeholder="Örn: Haftanın Yıldızı, Proje Ustası"
                    className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Açıklama / Kriter Özeti:</label>
                  <textarea
                    rows={2}
                    value={defFormDesc}
                    onChange={(e) => setDefFormDesc(e.target.value)}
                    placeholder="Örn: Hafta boyunca tüm ödevlerini tam ve zamanında teslim eden öğrenci."
                    className="w-full font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Simge / İkon:</label>
                    <select
                      value={defFormIcon}
                      onChange={(e) => setDefFormIcon(e.target.value)}
                      className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {ICON_OPTIONS.map((ico) => (
                        <option key={ico.id} value={ico.id}>
                          {ico.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Renk Teması:</label>
                    <select
                      value={defFormTheme}
                      onChange={(e) => setDefFormTheme(e.target.value)}
                      className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {THEME_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
                  💡 Bu rozet tanımını güncellemeniz, daha önce öğrencilerinize vermiş olduğunuz rozetlerin isim ve içeriğini etkilemez.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewDefModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDefinition}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDefinition ? 'Değişiklikleri Kaydet' : 'Rozet Türünü Oluştur'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
