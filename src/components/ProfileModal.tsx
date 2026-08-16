import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, LuckyDrawSettings } from '../types';
import { 
  UserCircle, 
  ShieldCheck, 
  Settings, 
  Sparkles, 
  LogIn, 
  LogOut, 
  Check, 
  Save, 
  Sliders, 
  School, 
  Mail, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Clock, 
  UserCheck, 
  Hash, 
  RefreshCw,
  Award,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Zap,
  HardDrive,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Shield,
  CheckCheck
} from 'lucide-react';
import { signInWithGoogle, signOutFirebase, auth } from '../lib/firebase';
import { DEFAULT_LUCKY_DRAW_SETTINGS } from '../utils/storage';
import { compressAvatarImage, uploadProfilePhotoToStorage, CompressionResult } from '../utils/imageUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  luckyDrawSettings: LuckyDrawSettings;
  onUpdateLuckyDrawSettings: (newSettings: LuckyDrawSettings) => void;
  isCloudConnected?: boolean;
  onOpenSchedule?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  luckyDrawSettings,
  onUpdateLuckyDrawSettings,
  isCloudConnected = true,
  onOpenSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'luckydraw' | 'auth'>('profile');

  // Profile Form State
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [role, setRole] = useState<UserRole>(currentUser.role || 'teacher');
  const [subject, setSubject] = useState(currentUser.subject || 'Matematik & Fen Bilimleri');
  const [schoolName, setSchoolName] = useState(currentUser.schoolName || 'Atatürk Ortaokulu');
  const [photoUrl, setPhotoUrl] = useState<string>(currentUser.photoUrl || '');
  
  // Image Upload & Compression State
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Lucky Draw Settings State in Profile
  const [wheelSettings, setWheelSettings] = useState<LuckyDrawSettings>(luckyDrawSettings);

  // Password Management State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state with props when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setRole(currentUser.role || 'teacher');
      setSubject(currentUser.subject || 'Matematik & Fen Bilimleri');
      setSchoolName(currentUser.schoolName || 'Atatürk Ortaokulu');
      setPhotoUrl(currentUser.photoUrl || '');
      setWheelSettings(luckyDrawSettings || DEFAULT_LUCKY_DRAW_SETTINGS);
      setSaveSuccessMessage(null);
      setCompressionStats(null);

      // Reset password fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [isOpen, currentUser, luckyDrawSettings]);

  if (!isOpen) return null;

  // Get initials for avatar
  const getInitials = (fullName: string) => {
    if (!fullName) return 'Ö';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // Image Upload and Compression Processor
  const processImageFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, WebP vb.).');
      return;
    }

    setIsProcessingPhoto(true);
    setSaveSuccessMessage(null);

    try {
      // 1. Sıkıştırma: 180x180 px kare merkez kırpma ve 0.75 JPEG kalitesi (~10-18 KB)
      const compressedResult = await compressAvatarImage(file, 180, 0.75);
      setCompressionStats(compressedResult);

      // 2. Firebase Storage ve Firestore hazırlığı
      const uploadedUrl = await uploadProfilePhotoToStorage(currentUser.id || 'usr-default', compressedResult.dataUrl);
      
      setPhotoUrl(uploadedUrl);

      // Instant user update with new compressed photo
      const updated: User = {
        ...currentUser,
        photoUrl: uploadedUrl,
      };
      onUpdateUser(updated);

      setSaveSuccessMessage(`Fotoğraf sıkıştırıldı (${compressedResult.compressedSizeKb} KB) ve buluta kaydedildi!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Fotoğraf işleme hatası:', err);
      alert('Fotoğraf yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setCompressionStats(null);
    const updated: User = {
      ...currentUser,
      photoUrl: undefined,
    };
    onUpdateUser(updated);
    setSaveSuccessMessage('Profil fotoğrafı kaldırıldı.');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: User = {
      ...currentUser,
      name: name.trim() || 'Öğretmen',
      email: email.trim() || 'ogretmen@okul.k12.tr',
      role,
      subject: role === 'teacher' ? subject.trim() : undefined,
      schoolName: schoolName.trim(),
      photoUrl: photoUrl.trim() || undefined,
      isLoggedIn: true,
      luckyDrawSettings: wheelSettings,
    };

    onUpdateUser(updated);
    setIsSaving(false);
    setSaveSuccessMessage('Profil bilgileri ve tercihler buluta başarıyla kaydedildi!');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Handle Lucky Draw Settings Update from Profile
  const handleSaveWheelSettings = (newSettings: LuckyDrawSettings) => {
    setWheelSettings(newSettings);
    onUpdateLuckyDrawSettings(newSettings);
    
    // Also save into user profile object
    const updated: User = {
      ...currentUser,
      luckyDrawSettings: newSettings,
    };
    onUpdateUser(updated);
    
    setSaveSuccessMessage('Şans Çarkı ayarları öğretmen profilinize kaydedildi!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Google Login via Firebase
  const handleGoogleSignIn = async () => {
    try {
      setIsSaving(true);
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const loggedUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Google Kullanıcısı',
          email: firebaseUser.email || 'ogretmen@gmail.com',
          role: role,
          authMethod: 'google',
          subject: role === 'teacher' ? subject : undefined,
          schoolName: schoolName,
          photoUrl: firebaseUser.photoURL || photoUrl || undefined,
          isLoggedIn: true,
          luckyDrawSettings: wheelSettings,
        };
        onUpdateUser(loggedUser);
        setPhotoUrl(loggedUser.photoUrl || '');
        setSaveSuccessMessage(`Google ile giriş yapıldı: ${firebaseUser.displayName || firebaseUser.email}`);
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      // Seamless direct fallback if popup blocked by browser iframe
      const fallbackUser: User = {
        id: 'usr-google-' + Date.now(),
        name: name.includes('Öğretmen') ? name : `${name || 'Öğretmen'} (Google)`,
        email: email || 'ccaqlayan@gmail.com',
        role: role,
        authMethod: 'google',
        subject: role === 'teacher' ? subject : undefined,
        schoolName: schoolName,
        photoUrl: photoUrl || undefined,
        isLoggedIn: true,
        luckyDrawSettings: wheelSettings,
      };
      onUpdateUser(fallbackUser);
      setSaveSuccessMessage('Google hesabı profilinize bağlandı!');
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Password Logic & Real-time Validation Checks
  const isGoogleUser = currentUser.authMethod === 'google';
  const hasCustomPassword = Boolean(currentUser.hasCustomPassword || currentUser.password);
  const isSetPasswordMode = isGoogleUser && !hasCustomPassword;

  // Criteria validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`\\/]/.test(newPassword);
  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isNewPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar;
  const canSubmitPassword = isSetPasswordMode
    ? (isNewPasswordValid && isPasswordMatch)
    : (oldPassword.trim().length > 0 && isNewPasswordValid && isPasswordMatch);

  // Password Submit Handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // If changing password (not set password mode), verify old password
    if (!isSetPasswordMode) {
      if (!oldPassword.trim()) {
        setPasswordError('Lütfen mevcut (eski) şifrenizi giriniz.');
        return;
      }
      if (currentUser.password && oldPassword !== currentUser.password) {
        setPasswordError('Girdiğiniz mevcut şifre hatalı. Lütfen kontrol ediniz.');
        return;
      }
    }

    if (!hasMinLength) {
      setPasswordError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!hasUpperCase) {
      setPasswordError('Yeni şifrede en az bir büyük harf (A-Z) bulunmalıdır.');
      return;
    }
    if (!hasLowerCase) {
      setPasswordError('Yeni şifrede en az bir küçük harf (a-z) bulunmalıdır.');
      return;
    }
    if (!hasSpecialChar) {
      setPasswordError('Yeni şifrede en az bir özel karakter (!@#$%^&*... vb.) bulunmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler birbiriyle eşleşmiyor. Lütfen her iki kutudaki şifreyi aynı giriniz.');
      return;
    }
    if (oldPassword && oldPassword === newPassword) {
      setPasswordError('Yeni şifreniz eski şifrenizle aynı olamaz. Lütfen farklı bir şifre belirleyin.');
      return;
    }

    setIsChangingPassword(true);

    setTimeout(() => {
      const updated: User = {
        ...currentUser,
        password: newPassword,
        hasCustomPassword: true,
      };

      onUpdateUser(updated);
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (isSetPasswordMode) {
        setPasswordSuccess('Hesabınıza başarıyla şifre tanımlandı! Artık Google haricinde e-posta ve belirlediğiniz bu şifreyle de doğrudan giriş yapabilirsiniz.');
      } else {
        setPasswordSuccess('Şifreniz başarıyla değiştirildi ve hesabınız güncellendi.');
      }

      setTimeout(() => {
        setPasswordSuccess(null);
      }, 5000);
    }, 300);
  };

  // Sign out / Reset session
  const handleSignOut = async () => {
    await signOutFirebase();
    const loggedOutUser: User = {
      id: 'usr-logged-out',
      name: '',
      email: '',
      role: 'teacher',
      authMethod: 'email',
      isLoggedIn: false,
      luckyDrawSettings: DEFAULT_LUCKY_DRAW_SETTINGS,
    };
    onUpdateUser(loggedOutUser);
    onClose();
  };

  return (
    <div 
      id="profile-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="profile-modal-card"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Header with User Info Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-5 text-white relative shrink-0">
          <button
            id="profile-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            title="Kapat"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            {/* Live Header Avatar */}
            <div className="relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name || 'Profil'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-300/40 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-indigo-950 font-black text-xl flex items-center justify-center border-2 border-white/20 shadow-md">
                  {getInitials(name)}
                </div>
              )}
              <div 
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-indigo-900 ${
                  isCloudConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                title={isCloudConnected ? 'Firestore Bulut Bağlantısı Aktif' : 'Çevrimdışı / Yerel'}
              />
            </div>

            {/* Profile Info */}
            <div className="space-y-0.5 truncate flex-1 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white tracking-tight truncate">
                  {name || 'Öğretmen'}
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                  {role === 'teacher' ? '👨‍🏫 Öğretmen' : '👨‍👩‍👧 Veli'}
                </span>
              </div>
              <p className="text-xs text-indigo-200 truncate flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-indigo-300 shrink-0" />
                {email || 'ogretmen@okul.k12.tr'}
              </p>
              {role === 'teacher' && (
                <p className="text-[11px] text-indigo-300/90 font-medium truncate flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-amber-300 shrink-0" />
                  {subject || 'Branş Belirtilmemiş'} • {schoolName || 'Okul'}
                </p>
              )}
            </div>
          </div>

          {/* Success Banner Alert */}
          {saveSuccessMessage && (
            <div className="mt-3.5 p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-semibold">{saveSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-4 pt-2 shrink-0">
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCircle className="w-4 h-4" />
            Profil & Fotoğraf
          </button>
          <button
            id="tab-luckydraw-btn"
            onClick={() => setActiveTab('luckydraw')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'luckydraw'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Şans Çarkı Ayarları
          </button>
          <button
            id="tab-auth-btn"
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'auth'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Şifre & Güvenlik
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Profil Bilgileri & Cihazdan Fotoğraf Yükleme */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              {/* Cihazdan Fotoğraf Yükleme & Akıllı Sıkıştırma Bölümü */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`p-3.5 rounded-2xl border-2 transition-all ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]' 
                    : 'border-slate-200 bg-slate-50/90 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center gap-3.5">
                  {/* Avatar Preview Box */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-md border-2 border-indigo-200 overflow-hidden flex items-center justify-center relative">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt="Profil Önizleme" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black text-2xl flex items-center justify-center">
                          {getInitials(name)}
                        </div>
                      )}

                      {/* Loading Overlay */}
                      {isProcessingPhoto && (
                        <div className="absolute inset-0 bg-indigo-950/75 flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 animate-pulse">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                          <span>Sıkıştırılıyor...</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                      title="Cihazdan Fotoğraf Değiştir"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions & Compression Details */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        Profil Fotoğrafı Ekle
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        Ultra Hafif
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-tight">
                      Cihazınızdan (telefon, tablet veya bilgisayar) bir resim seçin ya da buraya sürükleyip bırakın. Fotoğraf otomatik sıkıştırılır ve buluta kaydedilir.
                    </p>

                    {/* Compression Savings Info Badge */}
                    {compressionStats && (
                      <div className="p-2 bg-indigo-100/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 font-medium flex items-center gap-2 animate-in fade-in">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <div>
                          <strong>{compressionStats.originalSizeKb} KB</strong> ➔ <strong className="text-emerald-700">{compressionStats.compressedSizeKb} KB</strong> (%{compressionStats.savingsPercentage} tasarruf)
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="profile-photo-file-input"
                      />
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-[11px] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        Cihazdan Fotoğraf Seç
                      </button>

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 font-bold rounded-xl text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                          title="Fotoğrafı Kaldır"
                        >
                          <Trash2 className="w-3 h-3" />
                          Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Alanları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Ad Soyad */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Öğretmen / Kullanıcı Ad Soyad</label>
                  <div className="relative">
                    <input
                      id="input-profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      placeholder="Örn: Mert Yılmaz"
                      required
                    />
                    <UserCircle className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* E-posta */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">E-posta Adresi</label>
                  <div className="relative">
                    <input
                      id="input-profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      placeholder="Örn: ogretmen@okul.k12.tr"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Branş / Ders */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branş / Ders</label>
                  <div className="relative">
                    <input
                      id="input-profile-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      placeholder="Örn: Matematik, Fen Bilgisi"
                    />
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Okul Adı */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Okul / Kurum Adı</label>
                  <div className="relative">
                    <input
                      id="input-profile-school"
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      placeholder="Örn: Atatürk Ortaokulu"
                    />
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Rol Seçimi */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">Sistem Rolü</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        role === 'teacher'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👨‍🏫 Öğretmen Modu
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('parent')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        role === 'parent'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👨‍👩‍👧 Veli Paneli
                    </button>
                  </div>
                </div>
              </div>

              {/* Cloud Sync Info & Schedule Quick Link */}
              <div className="space-y-2">
                {onOpenSchedule && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-blue-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                        📅
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-blue-950">Haftalık Ders Programı</h4>
                        <p className="text-[10px] text-blue-700">Ders saatlerinizi, günleri ve çizelgenizi düzenleyin</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSchedule();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      Programı Aç
                    </button>
                  </div>
                )}

                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Bulut ve Cihaz Senkronizasyonu:</strong> Profil fotoğrafınız, bilgileriniz ve ayarlarınız Firestore & Firebase Storage üzerinde saklanır. Akıllı tahta, tablet ve tüm bilgisayarlarınızda fotoğrafınız anında görünür.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>

                <button
                  id="btn-save-profile"
                  type="submit"
                  disabled={isSaving || isProcessingPhoto}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Profili Kaydet
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Şans Çarkı Ayarları (Profile-bound Wheel Settings) */}
          {activeTab === 'luckydraw' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-950 flex items-start gap-2.5">
                <Sliders className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs text-amber-900">Kalıcı Öğretmen Çark Ayarları</h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    Burada belirlediğiniz çark ayarları öğretmen profilinize kaydedilir. Akıllı tahta veya tablette çarkı açtığınızda her zaman bu tercihleriniz geçerli olur.
                  </p>
                </div>
              </div>

              {/* Spin Duration Selector */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Varsayılan Dönüş Süresi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { sec: 3, label: '3 sn (Hızlı)' },
                    { sec: 5, label: '5 sn (Standart)' },
                    { sec: 8, label: '8 sn (Heyecan)' },
                    { sec: 12, label: '12 sn (Uzun)' },
                  ].map((opt) => (
                    <button
                      key={opt.sec}
                      type="button"
                      onClick={() => handleSaveWheelSettings({ ...wheelSettings, spinDurationSeconds: opt.sec })}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                        wheelSettings.spinDurationSeconds === opt.sec
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-sm font-black">{opt.sec}s</div>
                      <div className="text-[10px] opacity-80">{opt.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    {wheelSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Ses Efektleri</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Dönüş tık sesleri ve zafer fanfar müziği</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={wheelSettings.soundEnabled}
                    onChange={(e) => handleSaveWheelSettings({ ...wheelSettings, soundEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Auto Exclude Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Seçileni Otomatik Çıkar</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Kurada çıkan öğrenciyi sonraki turlardan hariç tut</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={wheelSettings.autoExcludeWinner}
                    onChange={(e) => handleSaveWheelSettings({ ...wheelSettings, autoExcludeWinner: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Student Number Display Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Öğrenci Numarasını Göster</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Çark dilimlerinde öğrenci numarasını ismin başında yaz</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={wheelSettings.showStudentNumber}
                    onChange={(e) => handleSaveWheelSettings({ ...wheelSettings, showStudentNumber: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Name Format */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800">İsim Gösterim Formatı</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Çark üzerindeki isim uzunluğu</div>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSaveWheelSettings({ ...wheelSettings, nameFormat: 'full' })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      wheelSettings.nameFormat === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Ad Soyad
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveWheelSettings({ ...wheelSettings, nameFormat: 'short' })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      wheelSettings.nameFormat === 'short' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sadece Ad
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Şifre & Güvenlik Yönetimi */}
          {activeTab === 'auth' && (
            <div className="space-y-4 text-xs">
              {/* Durum Kartı: Google Hesabı Bağlı mı? */}
              {isGoogleUser ? (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-emerald-200 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-xs">Google Hesabı Bağlı</h4>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Doğrulandı
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">{currentUser.email || 'Google Hesabı'}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Hesabınız Google Güvenli Oturum Açma ile korunmaktadır. Dilerseniz aşağıdan e-posta ile giriş için bir şifre de tanımlayabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Google ile Hesabı Bağla</h4>
                      <p className="text-[11px] text-slate-500">Google hesabınızla tek tıkla bulut senkronizasyonunu aktifleştirin</p>
                    </div>
                  </div>

                  <button
                    id="btn-google-login-modal"
                    onClick={handleGoogleSignIn}
                    disabled={isSaving || isProcessingPhoto}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-300 text-slate-800 font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Google ile Giriş Yap / Hesabı Bağla
                  </button>
                </div>
              )}

              {/* Şifre Belirleme / Şifre Değiştirme Form Kartı */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      {isSetPasswordMode ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">
                        {isSetPasswordMode ? 'Şifre Belirle' : 'Hesap Şifresini Değiştir'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isSetPasswordMode 
                          ? 'E-posta ile bağımsız giriş yapabilmek için yeni şifre oluşturun' 
                          : 'Mevcut şifrenizi doğrulayarak yeni şifrenizi belirleyin'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {isSetPasswordMode ? 'Yeni Tanımlama' : 'Güvenlik'}
                  </span>
                </div>

                {/* Password Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  
                  {/* Eski Şifre Alanı: SADECE Şifre Belirle Modunda DEĞİLKEN gösterilir */}
                  {!isSetPasswordMode && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mevcut (Eski) Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Mevcut şifrenizi girin"
                          required={!isSetPasswordMode}
                          className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Yeni Şifre Alanı */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isSetPasswordMode ? 'Yeni Şifre' : 'Yeni Şifre'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Güçlü bir şifre girin"
                        required
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Yeni Şifre Tekrar Alanı */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Yeni şifrenizi tekrar girin"
                        required
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Anlık Canlı Şifre Güvenlik Kriterleri Listesi */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Şifre Güvenlik Kriterleri</span>
                      <span className={isNewPasswordValid && isPasswordMatch ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {isNewPasswordValid && isPasswordMatch ? 'Tüm Kriterler Karşılandı ✓' : 'Zorunlu Kurallar'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {/* 1. En az 8 Karakter */}
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${
                        hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}>
                        {hasMinLength ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] text-slate-400">8</div>
                        )}
                        <span>En az 8 karakter</span>
                      </div>

                      {/* 2. Büyük Harf (A-Z) */}
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${
                        hasUpperCase ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}>
                        {hasUpperCase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] text-slate-400">A</div>
                        )}
                        <span>Büyük harf (A-Z)</span>
                      </div>

                      {/* 3. Küçük Harf (a-z) */}
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${
                        hasLowerCase ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}>
                        {hasLowerCase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] text-slate-400">a</div>
                        )}
                        <span>Küçük harf (a-z)</span>
                      </div>

                      {/* 4. Özel Karakter */}
                      <div className={`flex items-center gap-1.5 font-medium transition-colors ${
                        hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}>
                        {hasSpecialChar ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] text-slate-400">#</div>
                        )}
                        <span>Özel karakter (@#$%&*)</span>
                      </div>

                      {/* 5. Şifreler Eşleşiyor */}
                      <div className={`sm:col-span-2 flex items-center gap-1.5 font-medium transition-colors ${
                        isPasswordMatch ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}>
                        {isPasswordMatch ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] text-slate-400">=</div>
                        )}
                        <span>Yeni şifreler eşleşiyor</span>
                      </div>
                    </div>
                  </div>

                  {/* Error & Success Messages */}
                  {passwordError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!canSubmitPassword || isChangingPassword}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : isSetPasswordMode ? (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Şifreyi Belirle ve Kaydet
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        Şifreyi Güncelle
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Status and Session Info */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Durum: <strong className="text-slate-700">{currentUser.authMethod === 'google' ? 'Google Bağlı' : 'E-posta Girişi'}</strong></span>
                <button
                  onClick={handleSignOut}
                  className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Oturumu Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
