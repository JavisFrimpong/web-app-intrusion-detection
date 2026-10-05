import React from 'react';
import { Activity, CircleCheck } from 'lucide-react';
import AegisLogo from '../Brand/AegisLogo';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#050b14]/80 px-4 py-5 text-slate-500 backdrop-blur-md lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <AegisLogo compact />
          <div>
            <p className="text-xs font-bold text-slate-300">AEGIS Monitoring Workspace</p>
            <p className="mt-0.5 text-[11px] text-slate-600">Observe • Detect • Alert • Report</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-cyan-400"/> Monitoring API</span>
          <span className="text-slate-800">|</span>
          <span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-emerald-400"/> Service connected</span>
        </div>
      </div>
    </footer>
  );
}
