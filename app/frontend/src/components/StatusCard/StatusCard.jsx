import React from 'react';
import { motion } from 'framer-motion';

export default function StatusCard({ title, value, subtext, icon: Icon, color = 'blue', trend, badge }) {
  const colorMap = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.1)]',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    },
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`glass-panel p-5 rounded-2xl border bg-slate-900/90 transition-all duration-300 ${currentTheme.border} ${currentTheme.glow}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block">
            {title}
          </span>
          <div className="flex flex-wrap items-baseline gap-1.5">
            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-black text-slate-100 tracking-tight font-sans">
              {value}
            </h2>
            {badge && (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full font-mono uppercase shrink-0 ${badge.className}`}>
                {badge.text}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${currentTheme.iconBg} border border-white/10 shrink-0`}>
            <Icon className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs sm:text-sm">
        <span className="text-slate-200 font-mono font-medium flex items-center gap-1">
          {subtext}
        </span>
        {trend && (
          <span className={`font-mono font-bold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.text}
          </span>
        )}
      </div>
    </motion.div>
  );
}
