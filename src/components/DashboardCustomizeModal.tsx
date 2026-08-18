import React, { useState } from 'react';
import { 
  X, SlidersHorizontal, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, 
  Check, Sparkles, Clock, Bell, BookOpen, Layers, ShieldAlert, Zap, 
  AlertTriangle, CheckCircle2, Info, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayoutConfig, DashboardWidgetConfig, DashboardWidgetId } from '../types';
import { DEFAULT_DASHBOARD_LAYOUT, normalizeDashboardLayout, moveWidgetUp, moveWidgetDown, toggleWidgetVisibility } from '../utils/dashboardLayoutUtils';

interface DashboardCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout?: DashboardLayoutConfig;
  currentLayout?: DashboardLayoutConfig;
  onSaveLayout: (newLayout: DashboardLayoutConfig) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock: Clock,
  Bell: Bell,
  BookOpen: BookOpen,
  Sparkles: Sparkles,
  Layers: Layers,
  ShieldAlert: ShieldAlert,
  Zap: Zap,
  AlertTriangle: AlertTriangle,
  Award: Award,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Ders & Program': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  'Bildirimler': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  'Ders Seyri': { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  'Genel İstatistik': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  'Navigasyon': { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  'Öğrenci Analizi': { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  'Hızlı Araçlar': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'Rehberlik': { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
};

export const DashboardCustomizeModal: React.FC<DashboardCustomizeModalProps> = ({
  isOpen,
  onClose,
  layout,
  currentLayout,
  onSaveLayout,
}) => {
  const activeLayout = normalizeDashboardLayout(currentLayout || layout || DEFAULT_DASHBOARD_LAYOUT);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(activeLayout.widgets || []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep local state in sync when layout changes externally or modal opens
  React.useEffect(() => {
    if (isOpen) {
      const normalized = normalizeDashboardLayout(currentLayout || layout || DEFAULT_DASHBOARD_LAYOUT);
      setWidgets(normalized.widgets || []);
    }
  }, [isOpen, layout, currentLayout]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleMoveUp = (id: DashboardWidgetId) => {
    const updated = moveWidgetUp(widgets, id);
    setWidgets(updated);
    onSaveLayout({ widgets: updated, updatedAt: new Date().toISOString() });
  };

  const handleMoveDown = (id: DashboardWidgetId) => {
    const updated = moveWidgetDown(widgets, id);
    setWidgets(updated);
    onSaveLayout({ widgets: updated, updatedAt: new Date().toISOString() });
  };

  const handleToggle = (id: DashboardWidgetId) => {
    const updated = toggleWidgetVisibility(widgets, id);
    setWidgets(updated);
    onSaveLayout({ widgets: updated, updatedAt: new Date().toISOString() });
  };

  const handleResetDefaults = () => {
    setWidgets(DEFAULT_DASHBOARD_LAYOUT.widgets);
    onSaveLayout({
      widgets: DEFAULT_DASHBOARD_LAYOUT.widgets,
      updatedAt: new Date().toISOString(),
    });
    showToast('Anasayfa düzeni varsayılan ayarlara sıfırlandı.');
  };

  const handleEnableAll = () => {
    const updated = widgets.map((w) => ({ ...w, enabled: true }));
    setWidgets(updated);
    onSaveLayout({ widgets: updated, updatedAt: new Date().toISOString() });
    showToast('Tüm anasayfa kartları görünür yapıldı.');
  };

  const activeCount = widgets.filter((w) => w.enabled).length;
  const totalCount = widgets.length;

  return (
    <div 
      id="dashboard-customize-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="dashboard-customize-modal-container"
        className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Anasayfayı Özelleştir
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {activeCount} / {totalCount} Aktif
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Kartları açıp kapatın, oklarla sıralamayı değiştirin. Sizin hesabınıza özel kaydedilir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar (Actions) */}
        <div className="bg-slate-950/80 px-4 sm:px-6 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnableAll}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-500/30 hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hepsini Aç</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Varsayılan sıralama ve görünüme geri dön"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Sıfırla</span>
            </button>
          </div>

          {toastMessage && (
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Scrollable Widget Items List with Layout Animations */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {widgets.map((widget, index) => {
              const IconComponent = ICON_MAP[widget.iconName] || Sparkles;
              const catColor = CATEGORY_COLORS[widget.category] || {
                bg: 'bg-slate-800',
                text: 'text-slate-300',
                border: 'border-slate-700',
              };
              const isFirst = index === 0;
              const isLast = index === widgets.length - 1;

              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-colors duration-150 flex items-center justify-between gap-3 ${
                    widget.enabled
                      ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-900 opacity-60'
                  }`}
                >
                  {/* Left: Reorder position number + Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Index Badge */}
                    <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    {/* Widget Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Titles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {widget.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                        >
                          {widget.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {widget.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Up / Down arrow buttons & Toggle Switch */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Up Arrow Button */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveUp(widget.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isFirst
                          ? 'bg-slate-950/40 text-slate-700 border-slate-900 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700 active:scale-90'
                      }`}
                      title={isFirst ? 'Zaten en üstte' : 'Bir yukarı taşı'}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Down Arrow Button */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveDown(widget.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isLast
                          ? 'bg-slate-950/40 text-slate-700 border-slate-900 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700 active:scale-90'
                      }`}
                      title={isLast ? 'Zaten en altta' : 'Bir aşağı taşı'}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Visibility Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggle(widget.id)}
                      className={`ml-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        widget.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                      title={widget.enabled ? 'Görünümü Kapat (Gizle)' : 'Görünümü Aç (Göster)'}
                    >
                      {widget.enabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Açık</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Gizli</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">
              Değişiklikler anında anasayfanıza yansıtılır ve profilinizde saklanır.
            </span>
            <span className="sm:hidden text-[11px]">Değişiklikler anında kaydedildi.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Tamamla & Kapat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
