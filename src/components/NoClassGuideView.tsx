import React from 'react';
import {
  GraduationCap,
  Plus,
  Building2,
  Upload,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  Zap,
  BookMarked,
  Award,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

interface NoClassGuideViewProps {
  tabName?: string;
  tabKey?: 'quick-score' | 'notebook' | 'quiz-hw' | 'reports' | 'feedback' | 'default';
  onOpenAddClass: () => void;
  onNavigateManagement: () => void;
  onOpenBulkImport?: () => void;
  onOpenPdfImport?: () => void;
  onQuickCreateSampleClass?: () => void;
}

export const NoClassGuideView: React.FC<NoClassGuideViewProps> = ({
  tabName,
  tabKey = 'default',
  onOpenAddClass,
  onNavigateManagement,
  onOpenBulkImport,
  onOpenPdfImport,
  onQuickCreateSampleClass,
}) => {
  // Contextual info based on the active tab
  const getTabContext = () => {
    switch (tabKey) {
      case 'quick-score':
        return {
          icon: Zap,
          title: 'Pratik Artı / Eksi İçin Sınıf Gerekli',
          desc: 'Derste canlı artı ve eksi puanı verip öğrencilerin katılımını değerlendirmek için önce en az bir sınıf oluşturmalısınız.',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'notebook':
        return {
          icon: BookMarked,
          title: 'Defter Kontrolü İçin Sınıf Gerekli',
          desc: 'Öğrencilerinizin defter düzeni, özet tamlığı ve ders notlarını slider ile puanlamak için bir sınıf tanımlayınız.',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'quiz-hw':
        return {
          icon: Award,
          title: 'Quiz ve Ödev Takibi İçin Sınıf Gerekli',
          desc: 'Kazanım quizleri tanımlamak, not girmek ve ödev tamlıklarını kaydetmek için önce sınıf ve öğrenci listenizi ekleyin.',
          badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
        };
      case 'reports':
        return {
          icon: BarChart3,
          title: 'Raporlar ve Karne Notu İçin Sınıf Gerekli',
          desc: 'Ağırlıklı dönem sonu performans puanlarını hesaplamak ve Excel karne çıktısı almak için lütfen bir sınıf ekleyin.',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        };
      case 'feedback':
        return {
          icon: MessageSquare,
          title: 'Veli Bildirimleri İçin Sınıf Gerekli',
          desc: 'Yapay zeka ile kişiselleştirilmiş veli değerlendirme mesajları oluşturmak için önce sınıf ve öğrenci listenizi oluşturun.',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      default:
        return {
          icon: GraduationCap,
          title: 'Henüz Ekli Bir Sınıfınız Bulunmuyor',
          desc: 'Öğrenci performans takibi, canlı puanlama, defter kontrolü ve veli bildirimlerini kullanmak için ilk sınıfınızı ekleyin.',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        };
    }
  };

  const context = getTabContext();
  const IconComponent = context.icon;

  return (
    <div className="max-w-xl mx-auto py-6 px-2 animate-in fade-in zoom-in-95 duration-200">
      {/* Main Guidance Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        {/* Icon & Badge */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 mb-3">
            <IconComponent className="w-8 h-8" />
          </div>

          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full border mb-2 ${context.badgeColor}`}
          >
            {tabName || 'Sınıf Gereksinimi'}
          </span>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {context.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 max-w-md leading-relaxed">
            {context.desc}
          </p>

          {/* Primary Action: Add Class Button */}
          <div className="w-full max-w-sm mt-6 space-y-2.5">
            <button
              id="btn-guide-add-class"
              onClick={onOpenAddClass}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Hemen Yeni Sınıf Ekle</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Action: Go to Management */}
            <button
              id="btn-guide-go-management"
              onClick={onNavigateManagement}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Sınıf & Öğrenci Yönetim Menüsüne Git</span>
            </button>
          </div>

          {/* Import Alternatives */}
          {(onOpenBulkImport || onOpenPdfImport || onQuickCreateSampleClass) && (
            <div className="w-full max-w-sm mt-5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Veya Hızlı Başlangıç Seçenekleri
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onOpenBulkImport && (
                  <button
                    onClick={onOpenBulkImport}
                    className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-200 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Excel / CSV İçe Aktar</span>
                  </button>
                )}

                {onOpenPdfImport && (
                  <button
                    onClick={onOpenPdfImport}
                    className="p-2.5 bg-purple-50/80 hover:bg-purple-100 text-purple-950 rounded-xl border border-purple-200 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
                  >
                    <Upload className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="truncate">e-Okul PDF / Liste Yükle</span>
                  </button>
                )}

                {onQuickCreateSampleClass && (
                  <button
                    onClick={onQuickCreateSampleClass}
                    className="p-2.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 rounded-xl border border-indigo-200 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-bold sm:col-span-2 justify-center"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Örnek Başlangıç Sınıfı Ekle (5-A Matematik)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
