import React from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  WifiOff,
  RefreshCw,
  ServerCrash,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';
import DetectionTable from '../../components/DetectionTable/DetectionTable';
import MonitorControl from '../../components/MonitorControl/MonitorControl';

export default function ThreatDetection() {
  const { history, alerts, stats, isOnline, loading, recheckHistory } = useDetectionHistory(4000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              LIVE FLOW CAPTURE ENGINE
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              Live Detections
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Every row below is a real network flow captured, feature-extracted, and classified by the Random Forest
              engine running on the server — the same output you'd see in the capture terminal, mirrored here.
            </p>
          </div>

          <button
            onClick={recheckHistory}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 text-xs font-mono font-bold transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Start / Stop control — the client's replacement for running flow_monitor.py by hand */}
      <MonitorControl />

      {/* Offline / no-capture-running banner */}
      {!isOnline && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 flex items-start gap-3">
          <ServerCrash className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-300">Backend unreachable</h3>
            <p className="text-xs text-amber-200/80 font-sans mt-1">
              Couldn't reach the Flask API. Make sure the backend is running and that the flow capture engine
              (<code className="text-amber-300">flow_monitor.py</code>) is active on the server, then hit
              "Refresh Now". No cached or simulated data is shown while the backend is offline.
            </p>
          </div>
        </div>
      )}

      {isOnline && history.length === 0 && !loading && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">Connected, but no flows captured yet</h3>
            <p className="text-xs text-slate-400 font-sans mt-1">
              The API is reachable but the predictions database is empty. Start the flow capture engine on the
              server to begin populating live detections.
            </p>
          </div>
        </div>
      )}

      {/* Heuristic alerts panel (PortScan / DDoS pattern detections) */}
      {alerts.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100">Heuristic Pattern Alerts</h3>
            <span className="text-[10px] text-rose-300 font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
              {alerts.length} recent
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 font-bold">{alert.alertType}</span>
                  <span className="text-slate-500">{alert.timestamp}</span>
                </div>
                <p className="text-slate-300 mt-1 truncate" title={alert.message}>{alert.message}</p>
                <p className="text-slate-500 mt-0.5">Source: {alert.sourceIp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live feed table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <DetectionTable
          detections={history}
          title="Live Detection Feed"
        />
      </motion.div>

      {!isOnline && history.length === 0 && (
        <div className="text-center py-6 text-slate-600">
          <WifiOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs font-mono">Waiting for connection to the capture engine...</p>
        </div>
      )}
    </div>
  );
}
