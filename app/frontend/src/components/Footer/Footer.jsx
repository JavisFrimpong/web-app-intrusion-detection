import React from 'react';
import { Shield, Lock, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-6 px-4 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-600/20 text-cyan-400 border border-cyan-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 font-mono">
              Machine Learning-Based Intrusion Detection System
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              University Final Year Project · Random Forest Classifier · CICIDS2017 Dataset
            </p>
          </div>
        </div>

        {/* Right Info */}
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Flask REST API Connected
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> SOC Dashboard v1.0
          </span>
        </div>

      </div>
    </footer>
  );
}
