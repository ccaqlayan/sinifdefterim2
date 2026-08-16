import React from 'react';
import { ClassRoom, User, AcademicYearConfig } from '../types';
import { BookOpen, UserCircle, Sparkles, Calendar } from 'lucide-react';
import { getTermLabel } from '../utils/termUtils';

interface HeaderProps {
  user: User;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onOpenAuth: () => void;
  onResetData: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddClass?: () => void;
  academicYearConfig?: AcademicYearConfig;
  onOpenAcademicSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  classes,
  selectedClassId,
  onSelectClass,
  onOpenAuth,
  onResetData,
  activeTab,
  onSelectTab,
  onOpenAddClass,
  academicYearConfig,
  onOpenAcademicSettings,
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs px-3 sm:px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Brand Title */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
            P
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Performans Portalı
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {user.role === 'teacher' ? `👨‍🏫 ${user.name}` : `👨‍👩‍👧 Veli Paneli (${user.name})`}
            </p>
          </div>
        </div>

        {/* Right Side Actions & Class / Term Selector */}
        <div className="flex items-center gap-2">
          {/* Academic Term Quick Indicator & Settings Launcher */}
          {user.role === 'teacher' && academicYearConfig && onOpenAcademicSettings && (
            <button
              onClick={onOpenAcademicSettings}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-950 text-xs font-black transition-all shadow-2xs cursor-pointer shrink-0"
              title="Dönem ve Eğitim Yılı Tarih Ayarlarını Aç"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">{academicYearConfig.academicYear}</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                {termLabel}
              </span>
            </button>
          )}

          {user.role === 'teacher' && (
            classes.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-950 font-bold text-xs py-1.5 pl-2.5 pr-7 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition-all"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            ) : onOpenAddClass ? (
              <button
                onClick={onOpenAddClass}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
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
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-slate-800 transition-all shadow-2xs group cursor-pointer shrink-0"
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
                <span>{user.role === 'teacher' ? '👨‍🏫 Öğretmen' : '👨‍👩‍👧 Veli'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

