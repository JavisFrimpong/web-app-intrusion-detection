import React from 'react';
import { Shield, Cpu, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Loader({ text = "Evaluating traffic against Random Forest ML Model..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 glass-panel-glow text-center">
      <div className="relative flex items-center justify-center w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-blue-500 border-b-emerald-500 border-l-transparent"
        />

        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-200 tracking-wide font-mono">
          ANALYZING PACKET VECTOR
        </h4>
        <p className="text-xs text-slate-400 font-mono animate-pulse">
          {text}
        </p>
      </div>

      <div className="flex items-center space-x-1.5 text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
        <Shield className="w-3 h-3" />
        <span>CICIDS2017 Feature Extraction in Progress</span>
      </div>
    </div>
  );
}
