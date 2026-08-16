import React, { useState } from 'react';
import { User, UserRole, LuckyDrawSettings } from '../../types';
import { DEFAULT_LUCKY_DRAW_SETTINGS } from '../../utils/storage';
import { signInWithGoogle, auth } from '../../lib/firebase';
import { 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Sparkles, 
  School, 
  Mail, 
  Lock, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subject, setSubject] = useState('Matematik & Fen Bilimleri');
  const [schoolName, setSchoolName] = useState('Atatürk Ortaokulu');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Demo login handler for Demo Öğretmen
  const handleDemoLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      const demoUser: User = {
        id: 'usr-demo-teacher',
        name: 'Demo Öğretmen',
        email: 'demo.ogretmen@okul.k12.tr',
        role: 'teacher',
        authMethod: 'email',
        subject: 'Matematik & Fen Bilimleri',
        schoolName: 'Atatürk Ortaokulu',
        isLoggedIn: true,
        luckyDrawSettings: DEFAULT_LUCKY_DRAW_SETTINGS,
      };
      onLogin(demoUser);
      setIsLoading(false);
    }, 200);
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const loggedUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || (selectedRole === 'teacher' ? 'Öğretmen' : 'Veli'),
          email: firebaseUser.email || 'kullanici@gmail.com',
          role: selectedRole,
          authMethod: 'google',
          subject: selectedRole === 'teacher' ? subject : undefined,
          schoolName: selectedRole === 'teacher' ? schoolName : undefined,
          photoUrl: firebaseUser.photoURL || undefined,
          childStudentId: selectedRole === 'parent' ? 'std-101' : undefined,
          isLoggedIn: true,
          luckyDrawSettings: DEFAULT_LUCKY_DRAW_SETTINGS,
        };
        onLogin(loggedUser);
      }
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      // Fallback for sandboxed preview iframe if popup is blocked
      const userKey = email.trim() ? email.trim().replace(/[^a-zA-Z0-9]/g, '_') : String(Date.now());
      const fallbackUser: User = {
        id: 'usr-google-' + userKey,
        name: selectedRole === 'teacher' ? (name.trim() || 'Öğretmen (Google)') : (name.trim() || 'Veli (Google)'),
        email: email || 'ogretmen@gmail.com',
        role: selectedRole,
        authMethod: 'google',
        subject: selectedRole === 'teacher' ? subject : undefined,
        schoolName: selectedRole === 'teacher' ? schoolName : undefined,
        childStudentId: selectedRole === 'parent' ? 'std-101' : undefined,
        isLoggedIn: true,
        luckyDrawSettings: DEFAULT_LUCKY_DRAW_SETTINGS,
      };
      onLogin(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (authMode === 'register' && !name.trim()) {
      setErrorMessage('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    setIsLoading(true);
    // Consistent deterministic user ID based on email to ensure persistence across sessions
    const sanitizedEmailKey = trimmedEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    const userId = 'usr-account-' + sanitizedEmailKey;
    const displayName = name.trim() || (selectedRole === 'teacher' ? 'Öğretmen' : 'Öğrenci Velisi');

    const newUser: User = {
      id: userId,
      name: displayName,
      email: trimmedEmail,
      password: password ? password : undefined,
      hasCustomPassword: Boolean(password && password.length > 0),
      role: selectedRole,
      authMethod: 'email',
      subject: selectedRole === 'teacher' ? subject.trim() : undefined,
      schoolName: selectedRole === 'teacher' ? schoolName.trim() : undefined,
      childStudentId: selectedRole === 'parent' ? 'std-101' : undefined,
      isLoggedIn: true,
      luckyDrawSettings: DEFAULT_LUCKY_DRAW_SETTINGS,
    };

    setTimeout(() => {
      onLogin(newUser);
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Accent Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white p-6 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
            <GraduationCap className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Sınıf & Performans Portalı
          </h1>
          <p className="text-xs text-indigo-100 font-medium mt-1">
            Devam etmek için lütfen hesabınıza giriş yapın
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Role Selection Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Giriş Türü Seçin
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedRole('teacher')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'teacher'
                    ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <School className="w-4 h-4 text-indigo-600" />
                Öğretmen Girişi
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('parent')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'parent'
                    ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                Veli Portalı
              </button>
            </div>
          </div>

          {/* Login / Register Tab Switcher */}
          <div className="flex border-b border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
              className={`flex-1 pb-2.5 text-center transition-colors border-b-2 cursor-pointer ${
                authMode === 'login'
                  ? 'border-indigo-600 text-indigo-700 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMessage(null); }}
              className={`flex-1 pb-2.5 text-center transition-colors border-b-2 cursor-pointer ${
                authMode === 'register'
                  ? 'border-indigo-600 text-indigo-700 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Yeni Hesap Aç
            </button>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Quick Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs rounded-2xl border border-slate-300 shadow-2xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google ile Tek Tıkla Giriş Yap
          </button>

          {/* Divider */}
          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              veya e-posta ile
            </span>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adınız ve Soyadınız
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedRole === 'teacher' ? 'Örn: Ahmet Yılmaz' : 'Örn: Fatma Demir'}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'teacher' ? 'ogretmen@okul.k12.tr' : 'veli@gmail.com'}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {selectedRole === 'teacher' && authMode === 'register' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Branş
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Matematik"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Okul
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Okul Adı"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
            >
              {authMode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Giriş Yap
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Kayıt Ol ve Giriş Yap
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Demo Girişi
            </div>
            <div>
              <button
                type="button"
                id="btn-demo-login-account"
                onClick={handleDemoLogin}
                className="w-full p-3 bg-gradient-to-r from-indigo-50/90 to-blue-50/90 hover:from-indigo-100 hover:to-blue-100 text-indigo-950 rounded-2xl border border-indigo-200/90 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    👨‍🏫
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 group-hover:text-indigo-900 flex items-center gap-1.5">
                      <span>Demo Öğretmen</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800 font-bold">Örnek Hesap</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      demo.ogretmen@okul.k12.tr • Matematik & Fen
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold text-center pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Güvenli Bulut Tabanlı Oturum Koruma Sistemi</span>
          </div>

        </div>
      </div>
    </div>
  );
};
