import React from 'react';
import { ClassRoom, User, AcademicYearConfig } from '../types';
import { BookOpen, UserCircle, Sparkles, Calendar } from 'lucide-react';
import { getTermLabel } from '../utils/termUtils';
import { AppLogoIcon } from './common/AppLogo';

interface HeaderProps {
  user: User;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onOpenAuth: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddClass?: () => void;
  academicYearConfig?: AcademicYearConfig;
  onOpenAcademicSettings?: () => void;
  onOpenLessonLogModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  classes,
  selectedClassId,
  onSelectClass,
  onOpenAuth,
  activeTab,
  onSelectTab,
  onOpenAddClass,
  academicYearConfig,
  onOpenAcademicSettings,
  onOpenLessonLogModal,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const getInitials = (fullName: string) => {
    if (!fullName) return 'Ö';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const termLabel = academicYearConfig
    ? academicYearConfig.activeTermId === 'term1'
      ? `${academicYearConfig.term1.name}`
      : academicYearConfig.activeTermId === 'term2'
      ? `${academicYearConfig.term2.name}`
      : 'Tüm Yıl'
    : '2. Dönem';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs px-2.5 sm:px-4 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Logo & Brand Title */}
        <div className="flex items-center gap-2 shrink min-w-0">
          <AppLogoIcon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-2xs shrink-0" />
          <div className="leading-tight min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-indigo-950 tracking-tight flex items-center gap-1 truncate">
              Sınıf Defterim
            </h1>
            <p className="text-[9px] sm:text-[10px] text-indigo-700 font-extrabold uppercase tracking-wide truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
              Yıldız Anadolu Lisesi
            </p>
          </div>
        </div>

        {/* Right Side Actions & Class / Term Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Academic Term Quick Indicator & Settings Launcher (Hidden on Mobile) */}
          {(user.role === 'teacher' || user.role === 'admin') && academicYearConfig && onOpenAcademicSettings && (
            <button
              onClick={onOpenAcademicSettings}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-950 text-xs font-black transition-all shadow-2xs cursor-pointer shrink-0"
              title="Dönem, Takvim ve Yıllık Ders Planı Ayarlarını Aç"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{academicYearConfig.academicYear}</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                {termLabel}
              </span>
            </button>
          )}

          {(user.role === 'teacher' || user.role === 'admin') && (
            classes.length > 0 ? (
              <div className="relative max-w-[125px] xs:max-w-[155px] sm:max-w-none">
                <select
                  value={selectedClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="w-full bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-950 font-bold text-xs py-1.5 pl-2 pr-6 sm:pl-2.5 sm:pr-7 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition-all truncate"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 absolute right-1.5 sm:right-2 top-2.5 pointer-events-none" />
              </div>
            ) : onOpenAddClass ? (
              <button
                onClick={onOpenAddClass}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-1.5 px-2.5 sm:px-3 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Hemen yeni sınıf ekleyin"
              >
                <span>+ Sınıf Ekle</span>
              </button>
            ) : null
          )}

          {/* User Account / Profile Trigger Button */}
          <button
            id="header-profile-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-slate-800 transition-all shadow-2xs group cursor-pointer shrink-0"
            title="Öğretmen Profili & Hesap Yönetimi"
          >
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover border border-indigo-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                {getInitials(user.name)}
              </div>
            )}

            <div className="text-left hidden md:block max-w-[120px] lg:max-w-[160px]">
              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-none flex items-center gap-1">
                <span>{user.role === 'admin' ? '🛡️ Admin' : '👨‍🏫 Öğretmen'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

