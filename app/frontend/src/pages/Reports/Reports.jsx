import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import DetectionTable from '../../components/DetectionTable/DetectionTable';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';
import { exportToCSV, exportToJSON, triggerPrintReport } from '../../utils/reportExporter';

export default function Reports() {
  const { history, totalCount, threatCount, benignCount } = useDetectionHistory();

  const handleCSVDownload = () => {
    exportToCSV(history, `IDS_SOC_Report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleJSONDownload = () => {
    exportToJSON(history, `IDS_SOC_Report_${new Date().toISOString().slice(0,10)}.json`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Action Buttons */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              CYBER AUDIT & AUDIT TRAIL
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              Intrusion Detection Reports & Audit Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Download structured telemetry logs, inspect model classification history, and generate executive PDF security summaries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCSVDownload}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleJSONDownload}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-2"
            >
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={triggerPrintReport}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-mono font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
            >
              <Printer className="w-4 h-4 fill-slate-950" />
              <span>Print PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Total Logged Events</span>
          <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
          <span className="text-[11px] text-slate-500">Persistent local log buffer</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Benign Flows</span>
          <div className="text-2xl font-bold text-emerald-400">{benignCount}</div>
          <span className="text-[11px] text-emerald-500/80">Clean network traffic</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Intrusion Attacks</span>
          <div className="text-2xl font-bold text-rose-400">{threatCount}</div>
          <span className="text-[11px] text-rose-500/80">Intercepted by Random Forest</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Primary Threat Vector</span>
          <div className="text-lg font-bold text-amber-400 truncate">DoS / SYN Flood</div>
          <span className="text-[11px] text-slate-500">CICIDS2017 Benchmark</span>
        </div>
      </div>

      {/* Full Detection Table */}
      <DetectionTable detections={history} title="Full Intrusion Detection History & Audit Trail" />
    </div>
  );
}

// Helper icon component
function FileCode(props) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="m10 13-2 2 2 2"/>
      <path d="m14 13 2 2-2 2"/>
    </svg>
  );
}
