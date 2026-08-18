import React, { useState, useMemo } from 'react';
import { 
  BookOpen, MapPin, CheckCircle2, Circle, Clock, Sparkles, 
  Filter, Plus, Calendar, MessageSquare, Trash2, 
  Edit3, Share2, ArrowRight, Check, AlertCircle, ChevronDown, 
  ChevronUp, CheckSquare, ListTodo, GraduationCap, Copy, X
} from 'lucide-react';
import { ClassRoom, LessonLogNote } from '../../types';

interface LessonLogTimelineViewProps {
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  lessonLogs: LessonLogNote[];
  onOpenNewLogModal: (classId?: string, initialLog?: LessonLogNote) => void;
  onDeleteLog: (logId: string) => void;
  onToggleActionItem: (logId: string, actionText: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const LessonLogTimelineView: React.FC<LessonLogTimelineViewProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  lessonLogs,
  onOpenNewLogModal,
  onDeleteLog,
  onToggleActionItem,
  onNavigateTab,
}) => {
  const initialClassId = selectedClassId || classes[0]?.id || '';
  const [filterClassId, setFilterClassId] = useState<string>(initialClassId);
  const [actionFilter, setActionFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedRawMap, setExpandedRawMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Custom Themed Delete Confirmation State
  const [logToDelete, setLogToDelete] = useState<LessonLogNote | null>(null);

  // Sync with selectedClassId if changed externally
  React.useEffect(() => {
    if (selectedClassId && classes.some((c) => c.id === selectedClassId)) {
      setFilterClassId(selectedClassId);
    } else if (classes.length > 0 && (!filterClassId || !classes.some((c) => c.id === filterClassId))) {
      setFilterClassId(classes[0].id);
    }
  }, [selectedClassId, classes]);

  const toggleRawText = (id: string) => {
    setExpandedRawMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = (log: LessonLogNote) => {
    const text = `📚 ${log.className || 'Sınıf'} Ders Seyir Notu (${log.date})
📖 Kaynak: ${log.resourceName || 'Belirtilmedi'}
📍 Kaldığımız Yer: ${log.lastPageAndQuestion || 'Belirtilmedi'}
📖 Konu: ${log.lastTopic || 'Ders'}
📌 Gelecek Ders: ${(log.nextLessonActions || []).join(', ') || 'Yok'}
💬 Not: ${log.classAtmosphereNote || log.summary || ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filtered logs for selected class
  const filteredLogs = useMemo(() => {
    return lessonLogs.filter((log) => {
      // Class filter
      if (filterClassId && log.classId !== filterClassId) {
        return false;
      }

      // Action items filter
      if (actionFilter === 'pending') {
        const completed = log.completedActions || [];
        const all = log.nextLessonActions || [];
        const hasPending = all.some((a) => !completed.includes(a));
        if (!hasPending) return false;
      } else if (actionFilter === 'completed') {
        const completed = log.completedActions || [];
        const all = log.nextLessonActions || [];
        if (all.length === 0 || completed.length < all.length) return false;
      }

      return true;
    });
  }, [lessonLogs, filterClassId, actionFilter]);

  // Overall Statistics for the selected class
  const stats = useMemo(() => {
    const relevantLogs = filterClassId 
      ? lessonLogs.filter((l) => l.classId === filterClassId)
      : lessonLogs;

    let totalActions = 0;
    let completedActionsCount = 0;

    relevantLogs.forEach((log) => {
      const all = log.nextLessonActions || [];
      const done = log.completedActions || [];
      totalActions += all.length;
      completedActionsCount += done.length;
    });

    const latest = relevantLogs[0];

    return {
      totalNotes: relevantLogs.length,
      totalActions,
      pendingActions: totalActions - completedActionsCount,
      completedActions: completedActionsCount,
      latestLocation: latest ? `${latest.resourceName ? `[${latest.resourceName}] ` : ''}${latest.lastPageAndQuestion || latest.lastTopic}` : 'Henüz not yok',
    };
  }, [lessonLogs, filterClassId]);

  const currentClassObj = classes.find((c) => c.id === filterClassId) || classes[0];
  const currentFilterClassName = currentClassObj?.name || 'Seçili Sınıf';

  return (
    <div id="lesson-log-timeline-view" className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-md ring-2 ring-indigo-400/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Dijital Ders Seyir Defteri & "Nerede Kaldık?"
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                AI Destekli
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Her dersin son 20 saniyesinde sesli/yazılı not alın, kaldığınız yer ve gelecek ders hatırlatmaları bir sonraki girişte ekrana gelsin.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => onOpenNewLogModal(filterClassId || undefined)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>➕ Yeni Ders Sonu Notu Al (20 sn)</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {currentFilterClassName} Not Sayısı
            </span>
            <span className="text-base sm:text-lg font-black text-white">{stats.totalNotes} Ders Notu</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bekleyen Aksiyonlar</span>
            <span className="text-base sm:text-lg font-black text-amber-300">{stats.pendingActions} Hatırlatma</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tamamlanan Aksiyonlar</span>
            <span className="text-base sm:text-lg font-black text-emerald-300">{stats.completedActions} Tamamlandı</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">En Son Kalınan Yer</span>
            <span className="text-xs font-bold text-purple-200 truncate block mt-0.5" title={stats.latestLocation}>
              {stats.latestLocation}
            </span>
          </div>
        </div>
      </div>

      {/* Sınıf Butonları Şeridi (Tüm Sınıflar alanı kaldırıldı, butonlar yan yana sıralı, arama kaldırıldı) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        {/* Sınıfların Butonları Yanyana */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {classes.map((cls) => {
            const isSelected = filterClassId === cls.id;
            const count = lessonLogs.filter((l) => l.classId === cls.id).length;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setFilterClassId(cls.id);
                  onSelectClass(cls.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white ring-2 ring-indigo-400/50 shadow-md font-black'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/70'
                }`}
              >
                <span>{cls.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isSelected 
                    ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-400/30' 
                    : 'bg-slate-950/60 text-slate-400'
                }`}>
                  {count} Not
                </span>
              </button>
            );
          })}
        </div>

        {/* Aksiyon Durumu Filtresi */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="all">Tüm Hatırlatmalar</option>
            <option value="pending">⏳ Bekleyen Hatırlatmalar</option>
            <option value="completed">✅ Tamamlananlar</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3.5">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const completedActions = log.completedActions || [];
            const allActions = log.nextLessonActions || [];
            const isRawExpanded = Boolean(expandedRawMap[log.id]);

            const logDateStr = new Date(log.date).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              weekday: 'long',
            });

            return (
              <div
                key={log.id}
                id={`lesson-log-card-${log.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-md transition-all duration-200 space-y-3.5"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-2xs">
                      {log.className || 'Sınıf'}
                    </span>
                    <span className="text-xs font-bold text-indigo-300">
                      {log.subject || 'Ders'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {logDateStr} {log.time ? `• ${log.time}` : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopySummary(log)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Özeti Kopyala"
                    >
                      {copiedId === log.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Kopyala</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenNewLogModal(log.classId, log)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Silme Butonu -> Temaya Uyumlu Onay Penceresi Açar */}
                    <button
                      type="button"
                      onClick={() => setLogToDelete(log)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                      title="Seyir Notunu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
                  {/* Left: Kaldığımız Yer & Konu */}
                  <div className="md:col-span-6 bg-slate-950/70 border border-amber-500/20 rounded-xl p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Kaldığımız Yer / Sayfa & Soru
                        </span>
                        {log.resourceName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            📖 {log.resourceName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-amber-300 leading-snug">
                        {log.lastPageAndQuestion || 'Ders Tamamlandı'}
                      </h4>
                      {log.lastTopic && (
                        <p className="text-xs font-semibold text-slate-300 mt-1">
                          📚 <span className="text-slate-400">Konu:</span> {log.lastTopic}
                        </p>
                      )}
                    </div>

                    {log.summary && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300/90 leading-relaxed">
                        {log.summary}
                      </div>
                    )}
                  </div>

                  {/* Right: Gelecek Ders Aksiyonları / Hatırlatmalar */}
                  <div className="md:col-span-6 bg-slate-950/70 border border-indigo-500/20 rounded-xl p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Gelecek Ders Yapılacaklar
                        </span>
                        {allActions.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {completedActions.length} / {allActions.length}
                          </span>
                        )}
                      </div>

                      {allActions.length > 0 ? (
                        <div className="space-y-1.5 mt-1">
                          {allActions.map((action, idx) => {
                            const isDone = completedActions.includes(action);
                            return (
                              <div
                                key={idx}
                                onClick={() => onToggleActionItem(log.id, action)}
                                className={`flex items-start gap-2 p-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                  isDone
                                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 line-through opacity-70'
                                    : 'bg-slate-900/90 text-slate-100 hover:bg-slate-800 border border-slate-800 hover:border-indigo-400/40'
                                }`}
                              >
                                <button
                                  type="button"
                                  className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-400"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-indigo-400" />
                                  )}
                                </button>
                                <span className="leading-snug">{action}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">
                          Özel hatırlatma maddesi eklenmemiş.
                        </p>
                      )}
                    </div>

                    {/* Sınıf İklimi */}
                    {log.classAtmosphereNote && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-purple-300">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                        <span className="truncate">{log.classAtmosphereNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw Transcript Accordion */}
                {log.rawInputText && log.rawInputText !== log.summary && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleRawText(log.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isRawExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>Öğretmenin Girdiği Ham Not Metni</span>
                    </button>
                    {isRawExpanded && (
                      <p className="mt-1.5 p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono italic">
                        "{log.rawInputText}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-black text-white">
              {currentFilterClassName} için henüz ders notu kaydedilmemiş.
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Dersin son saniyelerinde sesle veya yazıyla not alın, nerede kaldığınızı ve ödev hatırlatmalarını unutmayın.
            </p>
            <button
              type="button"
              onClick={() => onOpenNewLogModal(filterClassId || undefined)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Ders Notunu Ekle (20 sn)</span>
            </button>
          </div>
        )}
      </div>

      {/* Temaya Uyumlu Özel Silme Onay Penceresi */}
      {logToDelete && (
        <div 
          id="delete-lesson-log-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Ders Notunu Sil</h3>
                  <p className="text-xs text-rose-300/80">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-indigo-300">
                {logToDelete.className} • {logToDelete.subject}
              </div>
              <div className="text-slate-300 font-medium">
                📅 {logToDelete.date} {logToDelete.time ? `(${logToDelete.time})` : ''}
              </div>
              <div className="text-amber-300 font-semibold truncate">
                📍 {logToDelete.resourceName ? `[${logToDelete.resourceName}] ` : ''}{logToDelete.lastPageAndQuestion || logToDelete.lastTopic}
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Bu ders seyir notunu silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLog(logToDelete.id);
                  setLogToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Notu Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
