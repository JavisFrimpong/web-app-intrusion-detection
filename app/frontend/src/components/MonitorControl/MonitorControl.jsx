import React, { useState } from 'react';
import { Play, Square, ShieldCheck, ShieldOff, RefreshCw, AlertCircle, Globe } from 'lucide-react';
import { useMonitorControl } from '../../hooks/useMonitorControl';

function formatUptime(seconds) {
  if (seconds == null) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function MonitorControl() {
  const {
    running, uptimeSeconds, target, checking, actionPending, error, backendReachable, start, stop
  } = useMonitorControl();

  const [targetInput, setTargetInput] = useState('');

  const handleStart = () => start(targetInput);
  const handleStop = () => stop();

  return (
    <div className={`glass-panel p-5 rounded-2xl border space-y-4 ${
      running ? 'border-emerald-500/40' : 'border-slate-800/80'
    }`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            running
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}>
            {running ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {checking ? 'Checking monitoring status…' : running ? 'Monitoring is ON' : 'Monitoring is OFF'}
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              {running
                ? `Watching ${target ? target : 'all traffic on this server'}${uptimeSeconds != null ? ` — running for ${formatUptime(uptimeSeconds)}` : ''}.`
                : 'Enter your website address below, then turn monitoring on.'}
            </p>
          </div>
        </div>
      </div>

      {!running && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. mywebsite.com (leave blank to watch everything)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500/50"
              disabled={checking || actionPending || !backendReachable}
            />
          </div>
          <button
            onClick={handleStart}
            disabled={checking || actionPending || !backendReachable}
            className="px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 shrink-0 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110"
          >
            {actionPending ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
            <span>{actionPending ? 'Starting…' : 'Start Monitoring'}</span>
          </button>
        </div>
      )}

      {running && (
        <button
          onClick={handleStop}
          disabled={actionPending}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
        >
          {actionPending ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
          <span>{actionPending ? 'Stopping…' : 'Stop Monitoring'}</span>
        </button>
      )}

      {!backendReachable && (
        <p className="text-[11px] text-amber-400 font-mono">Can't reach the server to check monitoring status.</p>
      )}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
