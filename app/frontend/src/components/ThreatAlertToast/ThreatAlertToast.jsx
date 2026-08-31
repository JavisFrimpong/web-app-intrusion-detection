import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Radio, ArrowRight } from 'lucide-react';

export default function ThreatAlertToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewThreat = (event) => {
      const threat = event.detail;
      
      // Add unique ID and timestamp for UI key
      const newToast = {
        toastId: `toast-${Date.now()}-${Math.random()}`,
        ...threat
      };

      setToasts(prev => [newToast, ...prev].slice(0, 3)); // Max 3 toasts at once

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== newToast.toastId));
      }, 6000);
    };

    window.addEventListener('ids-new-threat', handleNewThreat);
    return () => {
      window.removeEventListener('ids-new-threat', handleNewThreat);
    };
  }, []);

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm space-y-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.toastId}
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 100, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-full bg-slate-950/95 border border-rose-500/50 shadow-[0_0_20px_rgba(239,68,68,0.25)] rounded-2xl p-4 overflow-hidden relative"
          >
            {/* Glowing background accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Live Indicator */}
            <div className="absolute top-3 right-3 flex items-center space-x-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                LIVE BLOCK
              </span>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>

              <div className="space-y-1 pr-6 flex-1">
                <h4 className="text-xs font-mono font-black text-rose-400 uppercase tracking-wide">
                  Intrusion Vector Blocked
                </h4>
                <div className="text-sm font-extrabold text-slate-100 leading-tight">
                  {toast.attackType}
                </div>
                
                <div className="pt-2 border-t border-slate-900 mt-2 space-y-1 font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Source IP:</span>
                    <span className="text-slate-200 font-semibold">{toast.sourceIp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dest Port:</span>
                    <span className="text-slate-200 font-semibold">{toast.destPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ML Confidence:</span>
                    <span className="text-emerald-400 font-bold">{toast.confidence.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.toastId)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
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
