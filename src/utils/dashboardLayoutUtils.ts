import { DashboardLayoutConfig, DashboardWidgetConfig, DashboardWidgetId } from '../types';

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'current_lesson',
    title: 'Canlı / Sıradaki Ders & Plan Kartı',
    description: 'Canlı ders geri sayımı, sınıf bilgisi ve MEB yıllık planı haftalık kazanımları',
    category: 'Ders & Program',
    iconName: 'Clock',
    enabled: true,
  },
  {
    id: 'alerts_banner',
    title: 'Akıllı Bildirim & Hatırlatıcılar',
    description: 'Günü gelen ödevler, yaklaşan quizler ve eksik defter kontrolleri uyarı şeridi',
    category: 'Bildirimler',
    iconName: 'Bell',
    enabled: true,
  },
  {
    id: 'last_lesson_log',
    title: 'Geçen Ders Nerede Kaldık? (Seyir Notu)',
    description: 'Son işlenen dersin kalınan sayfası/sorusu ve gelecek ders yapılacaklar listesi',
    category: 'Ders Seyri',
    iconName: 'BookOpen',
    enabled: true,
  },
  {
    id: 'class_hero_summary',
    title: 'Seçili Sınıf Özet & İstatistik Kartı',
    description: 'Sınıf ortalaması, net artı/eksi sayıları, defter tamlık % ve pekiyi öğrenci sayısı',
    category: 'Genel İstatistik',
    iconName: 'Sparkles',
    enabled: true,
  },
  {
    id: 'class_selector_slider',
    title: 'Sınıflarım Hızlı Seçim Şeridi',
    description: 'Tüm sınıflarınız arasında yatay kaydırarak tek tıkla geçiş yapma kartları',
    category: 'Navigasyon',
    iconName: 'Layers',
    enabled: true,
  },
  {
    id: 'weekly_stars',
    title: 'Haftanın Yıldızları (En Çok Artı Alanlar)',
    description: 'Bu hafta sınıfta en yüksek performans / artı puan toplayan başarılı öğrenciler sıralaması',
    category: 'Öğrenci Analizi',
    iconName: 'Award',
    enabled: true,
  },
  {
    id: 'student_risk_radar',
    title: 'Riskli Öğrenci Alarmı & Erken Müdahale',
    description: 'Son 3 haftada performansı veya ödev tamlığı kritik seviyeye düşen öğrencilerin radarı',
    category: 'Öğrenci Analizi',
    iconName: 'ShieldAlert',
    enabled: true,
  },
  {
    id: 'quick_actions_grid',
    title: 'Hızlı İşlem Paneli (Modül Kısayolları)',
    description: 'Seyir Defteri, Canlı Artı/Eksi, Şans Çarkı, Quiz, Ödev ve Raporlar kısayol butonları',
    category: 'Hızlı Araçlar',
    iconName: 'Zap',
    enabled: true,
  },
  {
    id: 'quick_badge_award',
    title: 'Hızlı Rozet & Ödül Verme Kutusu',
    description: 'Öğrencilere anında başarı rozeti ve tebrik ödülü tanımlama modülü',
    category: 'Hızlı Araçlar',
    iconName: 'Award',
    enabled: true,
  },
  {
    id: 'smart_warnings',
    title: 'Öğretmen Akıllı Tavsiye & Uyarı Kutusu',
    description: 'Düşük defter tamlığı ve özel öğrenci durumlarında önerilen veli bilgilendirme rehberi',
    category: 'Rehberlik',
    iconName: 'AlertTriangle',
    enabled: true,
  },
];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutConfig = {
  widgets: DEFAULT_DASHBOARD_WIDGETS,
  updatedAt: new Date().toISOString(),
};

/**
 * Normalizes stored layout to ensure all current widgets are present,
 * handles any missing widget gracefully, and keeps user's custom order and visibility.
 */
export function normalizeDashboardLayout(stored?: DashboardLayoutConfig | null): DashboardLayoutConfig {
  if (!stored || !Array.isArray(stored.widgets) || stored.widgets.length === 0) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  const existingMap = new Map<DashboardWidgetId, DashboardWidgetConfig>();
  stored.widgets.forEach((w) => {
    if (w && w.id) {
      existingMap.set(w.id, w);
    }
  });

  const mergedWidgets: DashboardWidgetConfig[] = [];

  // Add existing widgets in their saved order with updated titles/descriptions if changed
  stored.widgets.forEach((saved) => {
    const defaultDef = DEFAULT_DASHBOARD_WIDGETS.find((d) => d.id === saved.id);
    if (defaultDef) {
      mergedWidgets.push({
        ...defaultDef,
        enabled: saved.enabled !== false, // default true
      });
      existingMap.delete(saved.id);
    }
  });

  // Append any newly introduced widgets that weren't in user's saved config
  DEFAULT_DASHBOARD_WIDGETS.forEach((def) => {
    if (!mergedWidgets.some((w) => w.id === def.id)) {
      mergedWidgets.push({ ...def });
    }
  });

  return {
    widgets: mergedWidgets,
    updatedAt: stored.updatedAt || new Date().toISOString(),
  };
}

/**
 * Moves a widget up in the layout list.
 */
export function moveWidgetUp(widgets: DashboardWidgetConfig[], widgetId: DashboardWidgetId): DashboardWidgetConfig[] {
  const index = widgets.findIndex((w) => w.id === widgetId);
  if (index <= 0) return widgets;

  const updated = [...widgets];
  const item = updated[index];
  updated[index] = updated[index - 1];
  updated[index - 1] = item;
  return updated;
}

/**
 * Moves a widget down in the layout list.
 */
export function moveWidgetDown(widgets: DashboardWidgetConfig[], widgetId: DashboardWidgetId): DashboardWidgetConfig[] {
  const index = widgets.findIndex((w) => w.id === widgetId);
  if (index < 0 || index >= widgets.length - 1) return widgets;

  const updated = [...widgets];
  const item = updated[index];
  updated[index] = updated[index + 1];
  updated[index + 1] = item;
  return updated;
}

/**
 * Toggles a widget's enabled status.
 */
export function toggleWidgetVisibility(widgets: DashboardWidgetConfig[], widgetId: DashboardWidgetId): DashboardWidgetConfig[] {
  return widgets.map((w) => {
    if (w.id === widgetId) {
      return { ...w, enabled: !w.enabled };
    }
    return w;
  });
}
