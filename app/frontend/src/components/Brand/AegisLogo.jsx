import React from 'react';

export default function AegisLogo({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 72 80"
        className={compact ? 'w-9 h-10 shrink-0' : 'w-11 h-12 shrink-0'}
        aria-label="AEGIS SOC"
        role="img"
      >
        <defs>
          <linearGradient id="aegisShield" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f3b78" />
            <stop offset="55%" stopColor="#075985" />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>
          <linearGradient id="aegisMark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path d="M36 3 64 14v23c0 18-10.5 31.5-28 40C18.5 68.5 8 55 8 37V14L36 3Z" fill="url(#aegisShield)" stroke="#38bdf8" strokeOpacity=".45" />
        <path d="M36 13 55 51h-9.5L36 31.5 26.5 51H17L36 13Z" fill="url(#aegisMark)" />
        <path d="M20 51c11-8 22-10 34-4-5 9-11 15-18 19-7-3.5-12.5-8.5-16-15Z" fill="url(#aegisMark)" opacity=".88" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="text-xl font-black tracking-[0.22em] text-slate-100">AEGIS</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-px w-5 bg-cyan-400/80" />
            <span className="text-[10px] tracking-[0.45em] text-cyan-300 font-semibold">SOC</span>
            <span className="h-px w-5 bg-cyan-400/80" />
          </div>
        </div>
      )}
    </div>
  );
}
