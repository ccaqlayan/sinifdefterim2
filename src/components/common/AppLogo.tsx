import React from 'react';

interface AppLogoIconProps {
  className?: string;
}

export const AppLogoIcon: React.FC<AppLogoIconProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      <defs>
        {/* Left Page Gradient */}
        <linearGradient id="bookLeftGrad" x1="20" y1="40" x2="100" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>

        {/* Right Page Gradient */}
        <linearGradient id="bookRightGrad" x1="100" y1="40" x2="180" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Star Sparkle Trail */}
        <linearGradient id="starTrailGrad" x1="80" y1="130" x2="125" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>

        {/* Pen Gradient */}
        <linearGradient id="penGrad" x1="130" y1="50" x2="170" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Book Base / Shadows */}
      <path
        d="M 100 168 C 120 160, 160 156, 182 164 L 182 58 C 160 50, 120 54, 100 62 C 80 54, 40 50, 18 58 L 18 164 C 40 156, 80 160, 100 168 Z"
        fill="#0369a1"
        opacity="0.25"
      />

      {/* Outer Cover Pages */}
      <path
        d="M 100 162 C 122 154, 162 150, 180 158 L 180 52 C 162 44, 122 48, 100 56 Z"
        fill="url(#bookRightGrad)"
      />
      <path
        d="M 100 162 C 78 154, 38 150, 20 158 L 20 52 C 38 44, 78 48, 100 56 Z"
        fill="url(#bookLeftGrad)"
      />

      {/* Inner White Pages Overlay */}
      <path
        d="M 98 156 C 78 148, 42 145, 26 152 L 26 57 C 42 50, 78 53, 98 60 Z"
        fill="#ffffff"
        opacity="0.9"
      />
      <path
        d="M 102 156 C 122 148, 158 145, 174 152 L 174 57 C 158 50, 122 53, 102 60 Z"
        fill="#ffffff"
        opacity="0.95"
      />

      {/* Spine line */}
      <path d="M 100 56 L 100 162" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />

      {/* Shooting Star Arc */}
      <path
        d="M 82 125 C 88 100, 100 78, 122 62"
        stroke="url(#starTrailGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 88 135 C 94 112, 106 90, 128 72"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Golden Star Icon */}
      <g transform="translate(126, 52) scale(0.95)">
        <polygon
          points="12,0 15.7,7.5 24,8.7 18,14.6 19.4,22.8 12,18.9 4.6,22.8 6,14.6 0,8.7 8.3,7.5"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="1.2"
        />
      </g>

      {/* Pen Checkmark and Lines on Right Page */}
      <path d="M 115 108 L 123 116 L 140 96" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 118 128 C 128 126, 138 128, 146 126" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Fountain Pen Drawing */}
      <g transform="translate(136, 68) rotate(28)">
        {/* Pen Barrel */}
        <rect x="0" y="0" width="14" height="42" rx="3" fill="url(#penGrad)" />
        {/* Metal Grip Collar */}
        <rect x="1" y="36" width="12" height="6" fill="#94a3b8" />
        {/* Nib */}
        <polygon points="1,42 13,42 7,54" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
        {/* Nib center line */}
        <line x1="7" y1="42" x2="7" y2="50" stroke="#0f172a" strokeWidth="1" />
      </g>
    </svg>
  );
};

interface AppLogoProps {
  variant?: 'full' | 'compact' | 'light';
  className?: string;
  showTagline?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'full',
  className = '',
  showTagline = true,
}) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <AppLogoIcon className="w-8 h-8 drop-shadow-xs" />
        <div className="leading-tight">
          <span className="text-sm font-black text-slate-900 tracking-tight block">
            sınıf defterim
          </span>
          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">
            YILDIZ ANADOLU LİSESİ
          </span>
        </div>
      </div>
    );
  }

  const isLight = variant === 'light';

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Visual Logo Icon */}
      <div className="relative mb-2 group">
        <div className="absolute inset-0 bg-sky-400/20 rounded-full blur-xl group-hover:bg-sky-400/30 transition-all pointer-events-none" />
        <AppLogoIcon className="w-20 h-20 sm:w-24 sm:h-24 relative z-10 drop-shadow-md transform transition-transform duration-300 group-hover:scale-105" />
      </div>

      {/* Main Brand Name */}
      <h1
        className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
          isLight ? 'text-white' : 'text-indigo-950'
        }`}
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        sınıf defterim
      </h1>

      {/* School Name */}
      <h2
        className={`text-xs sm:text-sm font-extrabold tracking-wider uppercase mt-1 ${
          isLight ? 'text-indigo-200' : 'text-indigo-700'
        }`}
      >
        YILDIZ ANADOLU LİSESİ
      </h2>

      {/* Tagline */}
      {showTagline && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`h-px w-6 ${isLight ? 'bg-indigo-300/40' : 'bg-slate-300'}`} />
          <p className={`text-[11px] font-medium ${isLight ? 'text-indigo-100' : 'text-slate-500'}`}>
            Öğrenci Performans Takip Sistemi
          </p>
          <span className={`h-px w-6 ${isLight ? 'bg-indigo-300/40' : 'bg-slate-300'}`} />
        </div>
      )}
    </div>
  );
};
