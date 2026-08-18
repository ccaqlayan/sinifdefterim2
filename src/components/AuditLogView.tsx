import React, { useState, useMemo } from 'react';
import { 
  AuditLog, AuditLogCategory, AuditLogActionType, ClassRoom, Student, User 
} from '../types';
import { 
  Footprints, ArrowLeft, Search, Filter, Calendar, Clock, 
  Trash2, Download, RefreshCw, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  BookMarked, Zap, Award, CheckSquare, Users, MessageSquare, 
  Settings, RotateCcw, Flame, ShieldAlert, Sparkles, FileText,
  PlusCircle, MinusCircle, UserCheck, X
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
  classes: ClassRoom[];
  students: Student[];
  currentUser?: User;
  onClearLogs?: () => void;
  onDeleteLog?: (logId: string) => void;
  onBack: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  classes,
  students,
  currentUser,
  onClearLogs,
  onDeleteLog,
  onBack,
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  
  // Expanded log IDs for drilldown
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Modals / Toast
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper map for students
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Helper map for classes
  const classMap = useMemo(() => {
    const map = new Map<string, ClassRoom>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  // Toggle log accordion
  const toggleExpand = (logId: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(filteredLogs.map((l) => l.id));
    setExpandedLogIds(allIds);
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  // Date check helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Category Filter
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'student_class') {
            if (log.category !== 'student' && log.category !== 'class') return false;
          } else if (log.category !== selectedCategory) {
            return false;
          }
        }

        // Action Type Filter
        if (selectedActionType !== 'all') {
          if (selectedActionType === 'bulk' && !log.isBulk) return false;
          else if (selectedActionType !== 'bulk' && log.actionType !== selectedActionType) return false;
        }

        // Class Filter
        if (selectedClassId !== 'all' && log.classId !== selectedClassId) {
          return false;
        }

        // Date Filter
        if (dateFilter === 'today' && log.date !== todayStr) return false;
        if (dateFilter === 'yesterday' && log.date !== yesterdayStr) return false;
        if (dateFilter === 'week' && log.date < sevenDaysAgoStr) return false;
        if (dateFilter === 'month' && log.date < thirtyDaysAgoStr) return false;

        // Search Term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = log.title?.toLowerCase().includes(term);
          const matchDesc = log.description?.toLowerCase().includes(term);
          const matchClass = log.className?.toLowerCase().includes(term);
          const matchStudents = log.studentDetails?.some((sd) =>
            sd.studentName?.toLowerCase().includes(term) ||
            sd.studentNumber?.toLowerCase().includes(term) ||
            sd.actionSummary?.toLowerCase().includes(term) ||
            sd.changeSummary?.toLowerCase().includes(term) ||
            String(sd.newValue || '').toLowerCase().includes(term)
          );
          if (!matchTitle && !matchDesc && !matchClass && !matchStudents) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date));
  }, [
    logs,
    selectedCategory,
    selectedActionType,
    selectedClassId,
    dateFilter,
    searchTerm,
    todayStr,
    yesterdayStr,
    sevenDaysAgoStr,
    thirtyDaysAgoStr,
  ]);

  // Reset page if filtered results change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedActionType, selectedClassId, dateFilter, searchTerm, pageSize]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const todayCount = logs.filter((l) => l.date === todayStr).length;
    const bulkCount = logs.filter((l) => l.isBulk).length;
    const deleteCount = logs.filter((l) => l.actionType === 'delete' || l.actionType === 'perm_delete' || l.category === 'trash').length;
    return { total, todayCount, bulkCount, deleteCount };
  }, [logs, todayStr]);

  // Format relative & absolute time
  const formatTimeDisplay = (isoTimestamp: string, logDate: string, logTime?: string) => {
    try {
      const logDateTime = isoTimestamp ? new Date(isoTimestamp) : new Date(`${logDate}T${logTime || '12:00'}:00`);
      const now = new Date();
      const diffMs = now.getTime() - logDateTime.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);

      let relative = '';
      if (diffMin < 1) relative = 'Az önce';
      else if (diffMin < 60) relative = `${diffMin} dk önce`;
      else if (diffHours < 24 && logDate === todayStr) relative = `${diffHours} sa önce`;
      else if (logDate === yesterdayStr) relative = 'Dün';
      else relative = logDate;

      const timeFormatted = logTime || logDateTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      return { relative, timeFormatted, full: logDateTime.toLocaleString('tr-TR') };
    } catch {
      return { relative: logDate, timeFormatted: logTime || '', full: logDate };
    }
  };

  // Category Badge & Icon styling
  const getCategoryMeta = (category: AuditLogCategory) => {
    switch (category) {
      case 'notebook':
        return {
          label: 'Defter Kontrolü',
          icon: BookMarked,
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          gradient: 'from-amber-500 to-amber-600',
        };
      case 'plusminus':
        return {
          label: 'Artı / Eksi',
          icon: Zap,
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          gradient: 'from-emerald-500 to-emerald-600',
        };
      case 'quiz':
        return {
          label: 'Quiz / Sınav',
          icon: Award,
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          gradient: 'from-purple-500 to-purple-600',
        };
      case 'homework':
        return {
          label: 'Ödev Takibi',
          icon: CheckSquare,
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          gradient: 'from-blue-500 to-blue-600',
        };
      case 'student':
      case 'class':
        return {
          label: 'Öğrenci & Sınıf',
          icon: Users,
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          gradient: 'from-indigo-500 to-indigo-600',
        };
      case 'schedule':
        return {
          label: 'Ders Programı',
          icon: Calendar,
          bg: 'bg-sky-100 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          gradient: 'from-sky-500 to-sky-600',
        };
      case 'parent':
        return {
          label: 'Veli İletişim',
          icon: MessageSquare,
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          gradient: 'from-teal-500 to-teal-600',
        };
      case 'trash':
        return {
          label: 'Çöp Kutusu',
          icon: Trash2,
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          gradient: 'from-rose-500 to-rose-600',
        };
      case 'settings':
        return {
          label: 'Ayarlar & Dönem',
          icon: Settings,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-500',
          gradient: 'from-slate-600 to-slate-700',
        };
      default:
        return {
          label: 'İşlem',
          icon: Footprints,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-indigo-500',
          gradient: 'from-indigo-500 to-indigo-600',
        };
    }
  };

  const getActionTypeBadge = (actionType: AuditLogActionType, isBulk?: boolean) => {
    if (isBulk) {
      return {
        label: 'TOPLU İŞLEM',
        className: 'bg-amber-500/15 text-amber-900 border-amber-300 font-black',
      };
    }
    switch (actionType) {
      case 'create':
        return { label: 'YENİ KAYIT', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'update':
        return { label: 'GÜNCELLEME', className: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'delete':
        return { label: 'SİLME', className: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'restore':
        return { label: 'GERİ YÜKLEME', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'perm_delete':
        return { label: 'KALICI SİLME', className: 'bg-rose-600 text-white border-rose-700' };
      case 'bulk_import':
        return { label: 'İÇE AKTARMA', className: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'send_message':
        return { label: 'BİLDİRİM', className: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'reset':
        return { label: 'SIFIRLAMA', className: 'bg-slate-200 text-slate-800 border-slate-300' };
      default:
        return { label: 'İŞLEM', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('Dışa aktarılacak işlem kaydı bulunamadı.');
      return;
    }

    const headers = ['Tarih', 'Saat', 'Kategori', 'İşlem Türü', 'Sınıf', 'Başlık', 'Açıklama', 'Öğrenci Sayısı'];
    const rows = filteredLogs.map((l) => [
      `"${l.date}"`,
      `"${l.time || ''}"`,
      `"${l.category}"`,
      `"${l.actionType}"`,
      `"${l.className || ''}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${l.affectedCount || 1}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ayak_Izi_Islem_Gecmisi_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV dosyası başarıyla indirildi.');
  };

  // JSON Export
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      showToast('Dışa aktarılacak işlem kaydı bulunamadı.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Ayak_Izi_Logs_${todayStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('JSON formatında işlem günlüğü indirildi.');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer shrink-0"
              title="Ayarlara Geri Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-400 text-slate-950 shadow-2xs">
                  <Footprints className="w-4 h-4" />
                </span>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Ayak İzi & İşlem Geçmişi
                </h1>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1 max-w-xl">
                Öğretmen tarafından yapılan her adım, not girişi, yoklama ve silme işleminin zaman damgalı denetim günlüğü.
              </p>
            </div>
          </div>

          {/* Action Buttons: Export & Clear */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="CSV olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV İndir</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="hidden xs:flex px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all items-center gap-1.5 cursor-pointer shadow-2xs"
              title="JSON olarak indir"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            {onClearLogs && (
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl border border-rose-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Tüm log geçmişini temizle"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wide">Toplam İşlem</p>
            <p className="text-base sm:text-lg font-black text-white mt-0.5">{metrics.total}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <p className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wide">Bugün Yapılan</p>
            <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{metrics.todayCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <p className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wide">Toplu İşlemler</p>
            <p className="text-base sm:text-lg font-black text-amber-300 mt-0.5">{metrics.bulkCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <p className="text-[10px] text-rose-300 font-extrabold uppercase tracking-wide">Silme / Çöp</p>
            <p className="text-base sm:text-lg font-black text-rose-400 mt-0.5">{metrics.deleteCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İşlem başlığı, öğrenci adı, numara veya açıklama ara..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Class filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
            >
              <option value="all">Tüm Sınıflar</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subject})
                </option>
              ))}
            </select>

            {/* Action Type filter */}
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
            >
              <option value="all">Tüm Hareketler</option>
              <option value="bulk">Toplu İşlemler</option>
              <option value="create">Yeni Kayıt</option>
              <option value="update">Güncelleme</option>
              <option value="delete">Silme</option>
              <option value="restore">Geri Yükleme</option>
              <option value="send_message">Veli Bildirimi</option>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="today">Bugün</option>
              <option value="yesterday">Dün</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Bu Ay</option>
            </select>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'notebook', label: 'Defter Kontrolü' },
            { id: 'plusminus', label: 'Artı / Eksi' },
            { id: 'quiz', label: 'Quizler' },
            { id: 'homework', label: 'Ödevler' },
            { id: 'student_class', label: 'Öğrenci & Sınıf' },
            { id: 'schedule', label: 'Ders Programı' },
            { id: 'parent', label: 'Veli İletişim' },
            { id: 'trash', label: 'Çöp Kutusu' },
            { id: 'settings', label: 'Ayarlar' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Bulk Accordion Controls & Results info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{filteredLogs.length}</span> işlem bulundu
            {searchTerm && <span className="text-slate-400">("{searchTerm}" filtresi aktif)</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Tüm Detayları Aç
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Main Audit Log Feed */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Footprints className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Henüz Kayıtlı Bir Hareket Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Seçilen filtre kriterlerine uygun işlem kaydı bulunamadı. Filtreleri temizleyebilir veya yeni adımlar atabilirsiniz.
          </p>
          {(searchTerm || selectedCategory !== 'all' || selectedActionType !== 'all' || selectedClassId !== 'all' || dateFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedActionType('all');
                setSelectedClassId('all');
                setDateFilter('all');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedLogs.map((log) => {
            const catMeta = getCategoryMeta(log.category);
            const actionBadge = getActionTypeBadge(log.actionType, log.isBulk);
            const timeInfo = formatTimeDisplay(log.timestamp, log.date, log.time);
            const isExpanded = expandedLogIds.has(log.id);
            const Icon = catMeta.icon;
            const hasDetails = (log.studentDetails && log.studentDetails.length > 0) || (log.metadata && Object.keys(log.metadata).length > 0);

            return (
              <div
                key={log.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isExpanded ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Log Row Main Header */}
                <div
                  onClick={() => hasDetails && toggleExpand(log.id)}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasDetails ? 'cursor-pointer hover:bg-slate-50/70' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Category Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${catMeta.bg}`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${actionBadge.className}`}>
                          {actionBadge.label}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catMeta.bg}`}>
                          {catMeta.label}
                        </span>

                        {log.className && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {log.className}
                          </span>
                        )}

                        {log.affectedCount && log.affectedCount > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                            {log.affectedCount} Öğrenci
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-800 mt-1 truncate">
                        {log.title}
                      </h4>

                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {log.description}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Time and expand toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-black text-slate-700">{timeInfo.timeFormatted}</p>
                      <p className="text-[10px] text-slate-400 font-bold" title={timeInfo.full}>
                        {timeInfo.relative}
                      </p>
                    </div>

                    {hasDetails && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className={`p-1.5 rounded-xl border transition-all ${
                            isExpanded ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drilldown (If batch or has student items) */}
                {isExpanded && hasDetails && (
                  <div className="p-3.5 sm:p-4 bg-slate-50/90 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                    {/* If student details exist */}
                    {log.studentDetails && log.studentDetails.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                          <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            İşlem Yapılan Öğrenciler ({log.studentDetails.length})
                          </p>
                          <span className="text-[10px] text-slate-400 font-bold">Girilen Veriler & Sonuçlar</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {log.studentDetails.map((sd, sIdx) => {
                            const std = studentMap.get(sd.studentId);
                            const name = sd.studentName || (std ? `${std.name} ${std.surname}` : 'Öğrenci');
                            const number = sd.studentNumber || std?.number || '';

                            const summaryText =
                              sd.actionSummary ||
                              sd.changeSummary ||
                              (sd.newValue !== undefined ? String(sd.newValue) : '') ||
                              (sd.oldValue !== undefined ? `Eski: ${sd.oldValue}` : '') ||
                              'İşlem Kaydedildi';

                            let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                            const lower = summaryText.toLowerCase();

                            if (
                              sd.badgeType === 'success' ||
                              lower.includes('+1') ||
                              lower.includes('artı') ||
                              lower.includes('tam (%100)') ||
                              lower.includes('eksiksiz') ||
                              lower.includes('tam yapıldı') ||
                              lower.includes('tamamlandı') ||
                              lower.includes('%100') ||
                              lower.includes('100 puan')
                            ) {
                              badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                            } else if (
                              sd.badgeType === 'danger' ||
                              lower.includes('-1') ||
                              lower.includes('eksi') ||
                              lower.includes('eksik') ||
                              lower.includes('yapmadı') ||
                              lower.includes('teslim edilmedi') ||
                              lower.includes('silindi') ||
                              lower.includes('%0') ||
                              lower.includes('%35')
                            ) {
                              badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                            } else if (
                              sd.badgeType === 'warning' ||
                              lower.includes('yarım') ||
                              lower.includes('geç') ||
                              lower.includes('%60') ||
                              lower.includes('%75') ||
                              lower.includes('%50')
                            ) {
                              badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                            } else if (
                              sd.badgeType === 'info' ||
                              lower.includes('quiz') ||
                              lower.includes('not:') ||
                              lower.includes('puan') ||
                              lower.includes('mesaj') ||
                              lower.includes('whatsapp') ||
                              lower.includes('sms')
                            ) {
                              badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                            }

                            return (
                              <div
                                key={sIdx}
                                className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-2 shadow-2xs hover:border-indigo-300/80 transition-all"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                                      {number ? (number.length > 2 ? number.slice(-2) : number) : name[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                                        {number && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono border border-slate-200">
                                            #{number}
                                          </span>
                                        )}
                                        <span className="truncate">{name}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Entered Data / Action Detail */}
                                <div className={`p-2 rounded-xl border text-xs font-bold flex items-start gap-2 ${badgeColor}`}>
                                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider opacity-70">
                                    Girilen Veri:
                                  </span>
                                  <span className="break-words font-black flex-1">{summaryText}</span>
                                </div>

                                {/* Value changes if oldValue / newValue available and distinct */}
                                {((sd.oldValue && sd.oldValue !== '-') || (sd.newValue && sd.newValue !== summaryText)) && (
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                    {sd.oldValue && sd.oldValue !== '-' && (
                                      <span className="text-slate-400">
                                        Önceki: <strong className="text-slate-600">{sd.oldValue}</strong>
                                      </span>
                                    )}
                                    {sd.newValue && (
                                      <span className="text-indigo-600 font-bold ml-auto">
                                        Yeni: <strong>{sd.newValue}</strong>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Metadata details if present */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Ek Detaylar</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(log.metadata).map(([k, v]) => (
                            <span key={k} className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <strong className="text-slate-700">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs font-bold text-slate-600">
              Sayfa <strong className="text-slate-900">{currentPage}</strong> / {totalPages}
              <span className="text-slate-400 font-normal ml-1.5">(Toplam {totalItems} kayıt)</span>
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-bold">Sayfa Başı:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-1 px-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="İlk Sayfa"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Önceki
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
            >
              Sonraki
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Son Sayfa"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-500 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">Ayak İzi Geçmişini Temizle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <p className="font-bold text-sm">Tüm İşlem Günlüğü Sıfırlansın mı?</p>
              <p>
                Bu işlemle geçmişte kaydedilen tüm adımlar ve işlem kayıtları temizlenecektir.
                Bu işlem öğrencilerin aktif not veya defter verilerini silmez, yalnızca işlem log geçmişini sıfırlar.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLogs?.();
                  setIsClearModalOpen(false);
                  showToast('İşlem günlüğü başarıyla temizlendi.');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
