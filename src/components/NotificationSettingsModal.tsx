import React, { useState } from 'react';
import {
  Bell,
  Clock,
  BookOpen,
  FileCheck2,
  Volume2,
  VolumeX,
  LayoutDashboard,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import { NotificationSettingsConfig, Homework, HomeworkRecord, Quiz, QuizScore, NotebookControl, ClassRoom, Student } from '../types';
import { DEFAULT_NOTIFICATION_CONFIG } from '../mockData';
import { getAllDashboardAlerts } from '../utils/dashboardAlertsUtils';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NotificationSettingsConfig;
  onSaveConfig: (updatedConfig: NotificationSettingsConfig) => void;
  // Raw items for live preview
  homeworks?: Homework[];
  homeworkRecords?: HomeworkRecord[];
  quizzes?: Quiz[];
  quizScores?: QuizScore[];
  notebookControls?: NotebookControl[];
  classes?: ClassRoom[];
  students?: Student[];
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  homeworks = [],
  homeworkRecords = [],
  quizzes = [],
  quizScores = [],
  notebookControls = [],
  classes = [],
  students = [],
}) => {
  const [formData, setFormData] = useState<NotificationSettingsConfig>({
    ...DEFAULT_NOTIFICATION_CONFIG,
    ...config,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute live preview of active alerts with current form settings
  const previewAlerts = getAllDashboardAlerts(
    homeworks,
    homeworkRecords,
    quizzes,
    quizScores,
    notebookControls,
    classes,
    students,
    'all',
    formData
  );

  const handleSave = () => {
    onSaveConfig(formData);
    setToastMessage('Bildirim ayarları başarıyla kaydedildi.');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setFormData(DEFAULT_NOTIFICATION_CONFIG);
    setToastMessage('Varsayılan bildirim ayarları yüklendi.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const dayOptions = [1, 2, 3, 5, 7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Bildirim & Uyarı Ayarları</h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/30">
                  Gün Bazlı
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 font-medium">
                Anasayfa uyarı eşiklerini, gecikme günlerini ve ses tercihlerini özelleştirin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-sm flex items-center gap-2 animate-in slide-in-from-top duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Live Alerts Summary Banner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Canlı Bildirim Önizlemesi
                </h4>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                Toplam {previewAlerts.totalAlertsCount} Aktif Uyarı
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-[11px] font-bold text-amber-900">Ödevler</div>
                    <div className="text-[10px] text-amber-700">Son {formData.homeworkDeadlineDays} gün kala</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-amber-500 text-white px-2 py-0.5 rounded-md">
                  {previewAlerts.homeworkCount}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-[11px] font-bold text-purple-900">Quiz Notları</div>
                    <div className="text-[10px] text-purple-700">{formData.quizUngradedDays} gün geciken</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-purple-600 text-white px-2 py-0.5 rounded-md">
                  {previewAlerts.quizCount}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-[11px] font-bold text-blue-900">Defter Kontrolü</div>
                    <div className="text-[10px] text-blue-700">{formData.notebookUngradedDays} gün geciken</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  {previewAlerts.notebookCount}
                </span>
              </div>
            </div>
          </div>

          {/* Setting 1: Ödev Teslim Uyarısı (Gün Bazlı) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Ödev Teslim Tarihi Uyarısı
                    </h3>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      Günlük Eşik
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Teslim tarihine kaç gün kala ve son gününde anasayfada uyarı rozeti gösterilsin?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    homeworkDeadlineEnabled: !prev.homeworkDeadlineEnabled,
                  }))
                }
                className={`w-12 h-6 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                  formData.homeworkDeadlineEnabled ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all shadow-xs ${
                    formData.homeworkDeadlineEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.homeworkDeadlineEnabled && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Uyarı Zamanı Eşiği:</span>
                  <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    Son {formData.homeworkDeadlineDays} Gün Kala
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {dayOptions.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, homeworkDeadlineDays: days }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.homeworkDeadlineDays === days
                          ? 'bg-amber-500 text-white shadow-xs scale-102'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {days === 1 ? 'Son 1 Gün' : `Son ${days} Gün`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Setting 2: Quiz Not Girişi Gecikme Uyarısı (Gün Bazlı) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Not Girilmemiş / Geciken Quiz Uyarısı
                    </h3>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                      Sınav Sonrası
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sınav veya Quiz tarihinin üzerinden kaç gün geçtikten sonra not girilmedi uyarısı verilsin?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    quizUngradedAlertEnabled: !prev.quizUngradedAlertEnabled,
                  }))
                }
                className={`w-12 h-6 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                  formData.quizUngradedAlertEnabled ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all shadow-xs ${
                    formData.quizUngradedAlertEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.quizUngradedAlertEnabled && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Gecikme Eşiği:</span>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    Sınavdan {formData.quizUngradedDays} Gün Sonra
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {dayOptions.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, quizUngradedDays: days }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.quizUngradedDays === days
                          ? 'bg-purple-600 text-white shadow-xs scale-102'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {days} Gün Sonra
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Setting 3: Defter Kontrolü Gecikme Uyarısı (Gün Bazlı) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Not Girilmemiş Defter Kontrolü Uyarısı
                    </h3>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      Kontrol Sonrası
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Defter kontrol tarihinin üzerinden kaç gün geçtikten sonra eksik not uyarısı verilsin?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    notebookUngradedAlertEnabled: !prev.notebookUngradedAlertEnabled,
                  }))
                }
                className={`w-12 h-6 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer ${
                  formData.notebookUngradedAlertEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all shadow-xs ${
                    formData.notebookUngradedAlertEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.notebookUngradedAlertEnabled && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Gecikme Eşiği:</span>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                    Kontrolden {formData.notebookUngradedDays} Gün Sonra
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {dayOptions.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, notebookUngradedDays: days }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.notebookUngradedDays === days
                          ? 'bg-blue-600 text-white shadow-xs scale-102'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {days} Gün Sonra
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Setting 4: Ek Tercihler (Ses & Anasayfa Görünürlük) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Ek Bildirim Tercihleri
            </h4>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  {formData.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">Sesli Uyarı Çanı</div>
                    <div className="text-[10px] text-slate-500">Bildirim kartlarında sesli efekt çalınsın</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  className={`w-10 h-5 rounded-full transition-all relative p-0.5 cursor-pointer ${
                    formData.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all shadow-xs ${
                      formData.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Anasayfa Bildirim Paneli</div>
                    <div className="text-[10px] text-slate-500">Anasayfada uyarı kartları gösterilsin</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      showOnDashboard: !prev.showOnDashboard,
                    }))
                  }
                  className={`w-10 h-5 rounded-full transition-all relative p-0.5 cursor-pointer ${
                    formData.showOnDashboard ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all shadow-xs ${
                      formData.showOnDashboard ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Varsayılanlara Dön
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Ayarları Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
