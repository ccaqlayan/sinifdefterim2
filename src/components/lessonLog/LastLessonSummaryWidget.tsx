import React, { useState } from 'react';
import { 
  BookOpen, MapPin, CheckCircle2, Circle, Clock, Sparkles, 
  MessageSquare, ChevronDown, ChevronUp, Plus, ArrowRight, Check, X, Edit3, Trash2
} from 'lucide-react';
import { ClassRoom, LessonLogNote } from '../../types';

interface LastLessonSummaryWidgetProps {
  currentClass: ClassRoom;
  latestLog?: LessonLogNote | null;
  onOpenNewLogModal: () => void;
  onNavigateToTimeline: () => void;
  onToggleActionItem?: (logId: string, actionText: string) => void;
  onEditLog?: (log: LessonLogNote) => void;
  onDeleteLog?: (logId: string) => void;
}

export const LastLessonSummaryWidget: React.FC<LastLessonSummaryWidgetProps> = ({
  currentClass,
  latestLog,
  onOpenNewLogModal,
  onNavigateToTimeline,
  onToggleActionItem,
  onEditLog,
  onDeleteLog,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (isDismissed) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2.5 px-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>{currentClass.name} - Ders Seyir Defteri Hatırlatıcısı Gizlendi</span>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
        >
          Göster
        </button>
      </div>
    );
  }

  // If no log exists for this class
  if (!latestLog) {
    return (
      <div 
        id="last-lesson-empty-widget"
        className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-white">
                {currentClass.name} Dijital Ders Seyir Defteri
              </h4>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Nerede Kaldık?
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dersin son 20 saniyesinde sesli veya yazılı not alın, bir sonraki derste nerede kaldığınızı anında hatırlayın.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewLogModal}
          className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ders Sonu Notu Al (20 sn)</span>
        </button>
      </div>
    );
  }

  const completedActions = latestLog.completedActions || [];
  const allActions = latestLog.nextLessonActions || [];
  const pendingActions = allActions.filter((act) => !completedActions.includes(act));
  const isAllActionsDone = allActions.length > 0 && pendingActions.length === 0;

  // Format date relative
  const logDateStr = new Date(latestLog.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });

  return (
    <div 
      id={`last-lesson-widget-${currentClass.id}`}
      className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl shadow-md overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-3.5 sm:p-4 border-b border-indigo-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-indigo-400/30">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                📍 Geçen Derste Nerede Kalmıştınız?
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                {currentClass.name} • {latestLog.subject || currentClass.subject}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-200/80 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{logDateStr} {latestLog.time ? `(${latestLog.time})` : ''}</span>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onEditLog && (
            <button
              type="button"
              onClick={() => onEditLog(latestLog)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Notu Düzenle"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            title={isExpanded ? 'Küçült' : 'Genişlet'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer"
            title="Paneli Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 text-slate-200">
          {/* Ana Konum / Kaldığımız Yer Kartı */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            {/* Sol: Kaldığımız Sayfa & Konu Vurgusu */}
            <div className="md:col-span-6 bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Kaldığımız Yer & Sayfa / Soru
                  </span>
                  {latestLog.resourceName && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      📖 {latestLog.resourceName}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                  {latestLog.lastPageAndQuestion || 'Ders Tamamlandı'}
                </h3>
                <p className="text-xs font-semibold text-slate-300 mt-1">
                  {latestLog.lastTopic ? `Konu: ${latestLog.lastTopic}` : ''}
                </p>
              </div>

              {latestLog.summary && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400 italic">
                  "{latestLog.summary}"
                </div>
              )}
            </div>

            {/* Sağ: Bu Ders Hatırlatmaları / Gelecek Ders Aksiyonları */}
            <div className="md:col-span-6 bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Bu Derste Yapılacaklar
                  </span>
                  {allActions.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {completedActions.length} / {allActions.length} Tamamlandı
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
                          onClick={() => onToggleActionItem && onToggleActionItem(latestLog.id, action)}
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
                    Belirtilmiş özel hatırlatma maddesi yok.
                  </p>
                )}
              </div>

              {/* Sınıf İklimi / Not */}
              {latestLog.classAtmosphereNote && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-purple-300">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                  <span className="truncate">{latestLog.classAtmosphereNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Alt Hızlı Butonlar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateToTimeline}
              className="text-xs text-indigo-300 hover:text-indigo-200 font-bold flex items-center gap-1 py-1.5 transition-colors cursor-pointer"
            >
              <span>Tüm Ders Seyir Defteri Geçmişi ({currentClass.name})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenNewLogModal}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Bu Dersin Notunu Al (20 sn)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
