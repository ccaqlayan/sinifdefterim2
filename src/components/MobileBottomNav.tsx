import React from 'react';
import { LayoutDashboard, Zap, BookMarked, Award, MessageSquare, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onSelectTab, role }) => {
  if (role === 'parent') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => onSelectTab('parent-portal')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'parent-portal' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>Veli Paneli</span>
          </button>
        </div>
      </nav>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Anasayfa', icon: LayoutDashboard },
    { id: 'quick-score', label: 'Pratik + / -', icon: Zap, badge: 'Sınıf' },
    { id: 'notebook', label: 'Defter', icon: BookMarked },
    { id: 'quiz-hw', label: 'Quiz / Ödev', icon: Award },
    { id: 'reports', label: 'Raporlar', icon: Award },
    { id: 'feedback', label: 'Veli & Ayar', icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-indigo-700 font-extrabold bg-indigo-50/90 scale-102'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px] text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
