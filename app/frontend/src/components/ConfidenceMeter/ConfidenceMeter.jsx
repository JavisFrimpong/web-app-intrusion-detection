import React from 'react';
import { motion } from 'framer-motion';

export default function ConfidenceMeter({ confidence = 0, isAttack = false, size = 'normal' }) {
  const score = Math.min(100, Math.max(0, confidence));
  
  // Color configuration
  const barGradient = isAttack
    ? 'from-red-600 via-rose-500 to-amber-500'
    : 'from-emerald-600 via-teal-400 to-cyan-400';

  const textColor = isAttack ? 'text-red-400' : 'text-emerald-400';
  const glowColor = isAttack ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(16,185,129,0.5)]';

  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">ML Confidence Score</span>
        <span className={`font-bold text-sm ${textColor}`}>
          {score.toFixed(2)}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 p-0.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} ${glowColor}`}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
        <span>0%</span>
        <span>50% Threshold</span>
        <span>100%</span>
      </div>
    </div>
  );
}
