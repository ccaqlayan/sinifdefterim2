import React from 'react';
import { ClassRoom, User } from '../types';
import { UserCheck, Sparkles, BookOpen, UserCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  user: User;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onOpenAuth: () => void;
  onResetData: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
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
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Brand Title */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
            P
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Performans Portalı
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200">
                Mobil Takip
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {user.role === 'teacher' ? `👨‍🏫 ${user.name}` : `👨‍👩‍👧 Veli Paneli (${user.name})`}
            </p>
          </div>
        </div>

        {/* Right Side Actions & Class Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user.role === 'teacher' && classes.length > 0 && (
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
          )}

          {/* Toggle Role Quick Button */}
          <button
            onClick={() => {
              if (user.role === 'teacher') {
                onSelectTab('parent-portal');
              } else {
                onSelectTab('dashboard');
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border shadow-2xs ${
              user.role === 'parent' || activeTab === 'parent-portal'
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Öğretmen / Veli Görünümü Geçişi"
          >
            {user.role === 'parent' || activeTab === 'parent-portal' ? '👨‍🏫 Öğretmen' : '👨‍👩‍👧 Veli'}
          </button>

          {/* User Account / Auth Modal Trigger */}
          <button
            onClick={onOpenAuth}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-all shrink-0"
            title="Giriş Yap / Profil"
          >
            <UserCircle className="w-5 h-5 text-indigo-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
