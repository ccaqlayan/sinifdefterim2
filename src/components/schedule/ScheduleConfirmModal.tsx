import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface ScheduleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
  lessonPreview?: {
    shortName: string;
    title: string;
    color: string;
    day?: string;
    period?: number;
  };
  doubleConfirm?: boolean;
  requiredWord?: string;
  itemCount?: number;
}

export const ScheduleConfirmModal: React.FC<ScheduleConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Evet, Sil',
  cancelText = 'Vazgeç',
  type = 'danger',
  lessonPreview,
  doubleConfirm = false,
  requiredWord = 'TEMİZLE',
  itemCount,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [typedWord, setTypedWord] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTypedWord('');
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isWordValid = typedWord.trim().toUpperCase() === requiredWord.toUpperCase();
  const canFinalConfirm = !doubleConfirm || (step === 2 && isWordValid && isChecked);

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
    setTypedWord('');
    setIsChecked(false);
  };

  const handleFinalConfirm = () => {
    if (doubleConfirm && !canFinalConfirm) return;
    onConfirm();
    onClose();
  };

  return (
    <div
      id="schedule-confirm-modal-overlay"
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="schedule-confirm-modal-card"
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Accent top strip */}
        <div
          className={`h-2.5 w-full ${
            type === 'danger'
              ? step === 2
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 animate-pulse'
                : 'bg-gradient-to-r from-rose-500 to-red-600'
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
        />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Top Row: Icon & Step Indicator & Close */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  type === 'danger'
                    ? step === 2
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}
              >
                {doubleConfirm && step === 2 ? (
                  <ShieldAlert className="w-6 h-6 stroke-[2.2] text-red-600 animate-bounce" />
                ) : type === 'danger' ? (
                  <Trash2 className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>

              {doubleConfirm && (
                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      step === 1
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Çift Onay Koruması ({step}/2)
                  </span>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {step === 1 ? '1. Aşama: İlk Teyit' : '2. Aşama: Kritik Güvenlik Onayı'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step 1: Initial Warning */}
          {(!doubleConfirm || step === 1) && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {description}
                </p>
              </div>

              {itemCount !== undefined && itemCount > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {itemCount}
                  </div>
                  <div className="text-xs text-rose-900 font-bold">
                    Bu işlemle toplam <span className="underline font-black">{itemCount} adet ders kaydı</span> haftalık programdan tamamen kaldırılacaktır.
                  </div>
                </div>
              )}

              {/* Optional Lesson Preview Badge */}
              {lessonPreview && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs text-center"
                    style={{ backgroundColor: lessonPreview.color }}
                  >
                    {lessonPreview.shortName}
                  </div>
                  <div className="truncate text-left">
                    <div className="text-xs font-black text-slate-800 truncate">
                      {lessonPreview.title}
                    </div>
                    {(lessonPreview.day || lessonPreview.period) && (
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {lessonPreview.day && <span>{lessonPreview.day}</span>}
                        {lessonPreview.day && lessonPreview.period && <span> • </span>}
                        {lessonPreview.period && <span>{lessonPreview.period}. Ders</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Strict Double Confirmation */}
          {doubleConfirm && step === 2 && (
            <div className="space-y-3.5 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Son Güvenlik Kontrolü
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  Yanlışlıkla silinmeyi önlemek için lütfen aşağıdaki kutuya büyük harflerle{' '}
                  <span className="bg-rose-200/80 px-1.5 py-0.5 rounded font-black text-rose-950 select-all border border-rose-300">
                    {requiredWord}
                  </span>{' '}
                  yazın ve onay kutusunu işaretleyin.
                </p>
              </div>

              {/* Text Input for Required Word */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Onay Kelimesini Yazın ({requiredWord}):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={typedWord}
                    onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
                    placeholder={`"${requiredWord}" yazınız`}
                    autoFocus
                    className={`w-full py-2.5 px-3.5 bg-white border-2 rounded-xl text-sm font-black tracking-widest uppercase transition-all outline-hidden ${
                      isWordValid
                        ? 'border-emerald-500 text-emerald-900 bg-emerald-50/40 ring-2 ring-emerald-400/20'
                        : 'border-rose-300 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                    }`}
                  />
                  {isWordValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Eşleşti
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-rose-200 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 mt-0.5 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-rose-900">
                  Tüm haftalık ders programımın kalıcı olarak silineceğini ve geri getirilemeyeceğini onaylıyorum.
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {doubleConfirm && step === 2 ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  disabled={!canFinalConfirm}
                  className={`flex-1 py-2.5 px-4 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                    canFinalConfirm
                      ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-lg cursor-pointer animate-pulse'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70 shadow-none'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Kalıcı Olarak Hepsini Sil
                </button>
              </>
            ) : doubleConfirm && step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Devam Et (2. Adım)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className={`flex-1 py-2.5 px-4 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {type === 'danger' && <Trash2 className="w-3.5 h-3.5" />}
                  {confirmText}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
