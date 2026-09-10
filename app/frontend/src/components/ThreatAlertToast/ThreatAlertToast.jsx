import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Volume2, VolumeX } from 'lucide-react';

export default function ThreatAlertToast() {
  const [toasts, setToasts] = useState([]);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const handleNewThreat = (event) => {
      if (muted) return;

      // Check if monitoring is active
      const isMonitoringActive = sessionStorage.getItem('ids_monitoring_active') === 'true';
      if (!isMonitoringActive) return;

      const threat = event.detail;

      const newToast = {
        toastId: `toast-${Date.now()}-${Math.random()}`,
        ...threat
      };

      setToasts(prev => [newToast, ...prev].slice(0, 3));

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== newToast.toastId));
      }, 6000);
    };

    window.addEventListener('ids-new-threat', handleNewThreat);
    return () => {
      window.removeEventListener('ids-new-threat', handleNewThreat);
    };
  }, [muted]);

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm space-y-3 pointer-events-none">
      {/* Toast Header Action Controls */}
      <div className="pointer-events-auto flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-xs font-mono text-slate-200">
        <span className="font-bold flex items-center gap-1.5 text-rose-400">
          <ShieldAlert className="w-4 h-4" /> Live Threat Alerts
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMuted(!muted)}
            className="p-1 text-slate-300 hover:text-white transition-colors"
            title={muted ? "Unmute alert toasts" : "Mute alert toasts"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={clearAllToasts}
            className="text-[11px] font-bold text-slate-400 hover:text-white"
          >
            Clear All
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!muted && toasts.map((toast) => (
          <motion.div
            key={toast.toastId}
            initial={{ opacity: 0, y: -20, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 80, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-full bg-slate-900 border border-rose-500/60 shadow-2xl rounded-2xl p-4 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>

              <div className="space-y-1.5 pr-6 flex-1">
                <h4 className="text-xs font-mono font-black text-rose-400 uppercase tracking-wide">
                  Suspicious Activity Detected
                </h4>
                <div className="text-base font-black text-slate-100 leading-tight">
                  {toast.attackType}
                </div>

                <div className="pt-2 border-t border-slate-800/90 mt-2 space-y-1 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source IP:</span>
                    <span className="text-slate-100 font-bold">{toast.sourceIp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dest Port:</span>
                    <span className="text-slate-100 font-bold">{toast.destPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ML Confidence:</span>
                    <span className="text-emerald-400 font-black">{toast.confidence ? toast.confidence.toFixed(2) : '98.50'}%</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.toastId)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
