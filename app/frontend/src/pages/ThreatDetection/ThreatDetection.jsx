import React from 'react';
import { motion } from 'framer-motion';
import { Radar, RefreshCw, ServerCrash, AlertTriangle, Info } from 'lucide-react';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';
import DetectionTable from '../../components/DetectionTable/DetectionTable';

export default function ThreatDetection() {
  const { history, alerts, isOnline, loading, recheckHistory } = useDetectionHistory(4000);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300"><Radar className="h-4 w-4"/> Live monitoring feed</span>
            <h1 className="mt-2 text-3xl font-black text-white">Suspicious Activity</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review traffic events and detection signals observed from websites connected to your AEGIS monitoring workspace.</p>
          </div>
          <button onClick={recheckHistory} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>
        </div>
      </section>

      {!isOnline && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/25 p-5">
          <ServerCrash className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"/>
          <div><h3 className="text-sm font-bold text-amber-200">Monitoring service unavailable</h3><p className="mt-1 text-xs text-amber-100/70">AEGIS could not reach the hosted monitoring API. Check the service connection and refresh this page.</p></div>
        </div>
      )}

      {isOnline && history.length===0 && !loading && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/65 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300"/>
          <div><h3 className="text-sm font-bold text-white">No monitoring events yet</h3><p className="mt-1 text-xs leading-5 text-slate-400">Add and connect a website from the Websites page. Detection events will appear here once traffic is being observed.</p></div>
        </div>
      )}

      {alerts.length>0 && (
        <section className="rounded-2xl border border-rose-500/20 bg-slate-900/65 p-5">
          <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-400"/><h3 className="text-sm font-bold text-white">Recent pattern alerts</h3><span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">{alerts.length}</span></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.slice(0,6).map(alert=><div key={alert.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-bold text-rose-300">{alert.alertType}</span><span className="text-slate-600">{alert.timestamp}</span></div><p className="mt-1 truncate text-slate-400" title={alert.message}>{alert.message}</p><p className="mt-1 text-slate-600">Source: {alert.sourceIp}</p></div>)}
          </div>
        </section>
      )}

      <motion.div initial={{opacity:0}} animate={{opacity:1}}>
        <DetectionTable detections={history} title="Monitoring Event Feed" />
      </motion.div>
    </div>
  );
}
