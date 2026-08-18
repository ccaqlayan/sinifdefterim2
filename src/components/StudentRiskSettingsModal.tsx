import React, { useState } from 'react';
import {
  ShieldAlert,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  Calendar,
  Sliders,
  Sparkles,
  Info,
  Flame,
  FileCheck2,
  BookOpen,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { RiskRadarConfig } from '../types';
import { DEFAULT_RISK_RADAR_CONFIG } from '../utils/studentRiskUtils';

interface StudentRiskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RiskRadarConfig;
  onSaveConfig: (updatedConfig: RiskRadarConfig) => void;
}

export const StudentRiskSettingsModal: React.FC<StudentRiskSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<RiskRadarConfig>({
    ...DEFAULT_RISK_RADAR_CONFIG,
    ...config,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(formData);
    setToastMessage('Risk alarmı kriterleri başarıyla kaydedildi!');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setFormData(DEFAULT_RISK_RADAR_CONFIG);
    setToastMessage('Varsayılan eşik değerlerine sıfırlandı.');
    setTimeout(() => setToastMessage(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-500/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Toast Message */}
        {toastMessage && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2.5 text-center font-black text-xs sm:text-sm flex items-center justify-center gap-2 animate-in slide-in-from-top">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-indigo-950 p-4 sm:p-6 border-b border-rose-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white border border-rose-400 flex items-center justify-center shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Riskli Öğrenci Alarm Kriterleri</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white border border-rose-400">
                  Ayar Paneli
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Erken uyarı radarı tetikleme eşiklerini ve hassasiyet ayarlarını özelleştirin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form Controls */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-white">
          
          {/* Main Toggle */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Erken Uyarı Radarı Etkinliği</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Devre dışı bırakılırsa riskli öğrenci uyarıları gizlenir
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Section 1: Time Window */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Calendar className="w-4 h-4" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                1. Analiz Zaman Dilimi (Kayan Pencere)
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Öğrencinin ödev, katılım ve quiz performansının kaç günlük geçmişe göre hesaplanacağını seçin.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: '14 Gün (2 Hafta)', value: 14 },
                { label: '21 Gün (3 Hafta)', value: 21 },
                { label: '28 Gün (4 Hafta)', value: 28 },
                { label: '42 Gün (6 Hafta)', value: 42 },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, windowDays: item.value })}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    formData.windowDays === item.value
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.value === 21 && (
                    <span className="text-[9px] font-bold text-rose-200 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-500/30">
                      Varsayılan
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Homework Threshold */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileCheck2 className="w-4 h-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  2. Ödev Tamamlama Eşiği
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableHomeworkAlert}
                  onChange={(e) => setFormData({ ...formData, enableHomeworkAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Belirtilen zaman diliminde ödev teslim oranı seçilen yüzdenin altına düştüğünde alarm tetiklenir.
            </p>

            {formData.enableHomeworkAlert && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">Ödev Tamamlama Eşiği:</span>
                  <span className="text-indigo-400 font-black text-sm">
                    % {formData.homeworkThresholdPercent} altına düşerse
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[30, 40, 50, 60, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setFormData({ ...formData, homeworkThresholdPercent: pct })}
                      className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        formData.homeworkThresholdPercent === pct
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      %{pct}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Plus/Minus Tolerance */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-4 h-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  3. Ders İçi Eksi Tolerans Eşiği
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableMinusAlert}
                  onChange={(e) => setFormData({ ...formData, enableMinusAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Belirtilen zaman diliminde alınan eksi sayısı seçilen tolerans sınırına ulaştığında veya aştığında alarm tetiklenir.
            </p>

            {formData.enableMinusAlert && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">Tolerans Edilen Maksimum Eksi:</span>
                  <span className="text-amber-400 font-black text-sm">
                    {formData.maxMinusAllowed} Eksi ve Üzeri
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setFormData({ ...formData, maxMinusAllowed: cnt })}
                      className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        formData.maxMinusAllowed === cnt
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {cnt} Eksi
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Quiz Score Threshold */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Award className="w-4 h-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  4. Quiz & Sınav Taban Puan Eşiği
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableQuizAlert}
                  onChange={(e) => setFormData({ ...formData, enableQuizAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Söz konusu haftalardaki quiz ortalaması taban puanın altında kaldığında öğrenci risk listesine alınır.
            </p>

            {formData.enableQuizAlert && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">Taban Puan Eşiği:</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {formData.quizScoreThreshold} Puan Altı
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[40, 50, 60, 70].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormData({ ...formData, quizScoreThreshold: score })}
                      className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        formData.quizScoreThreshold === score
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {score} Puan
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Notebook Threshold */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <BookOpen className="w-4 h-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  5. Defter Kontrol Eşik Oranı
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableNotebookAlert}
                  onChange={(e) => setFormData({ ...formData, enableNotebookAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Defter kontrol puanı ortalaması bu yüzdenin altında kalan öğrenciler uyarılır.
            </p>

            {formData.enableNotebookAlert && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-300">Defter Eşik Puanı:</span>
                  <span className="text-purple-400 font-black text-sm">
                    % {formData.notebookThresholdPercent} Altı
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[40, 50, 60, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setFormData({ ...formData, notebookThresholdPercent: pct })}
                      className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        formData.notebookThresholdPercent === pct
                          ? 'bg-purple-600 text-white border-purple-400 shadow'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      %{pct}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Sensitivity Level */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                6. Radar Hassasiyet Seviyesi
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Radar hassasiyeti, öğrencilerin 'Kritik Risk' seviyesine yükselme eşiğini kontrol eder.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {[
                {
                  id: 'high',
                  label: 'Yüksek Hassasiyet',
                  desc: 'Hafif performans düşüşlerinde de erkenden uyarır.',
                },
                {
                  id: 'normal',
                  label: 'Normal Hassasiyet',
                  desc: 'Dengeli ve standart erken uyarı algoritması.',
                },
                {
                  id: 'low',
                  label: 'Düşük Hassasiyet',
                  desc: 'Sadece ağır ve devam eden başarısızlıklarda uyarır.',
                },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, sensitivityLevel: lvl.id as any })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    formData.sensitivityLevel === lvl.id
                      ? 'bg-rose-950/80 border-rose-500 text-white ring-2 ring-rose-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-rose-300">{lvl.label}</div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{lvl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Varsayılana Sıfırla
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Kriterleri Kaydet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
