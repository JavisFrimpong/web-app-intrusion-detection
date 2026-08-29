import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Activity, 
  CheckCircle2, 
  XCircle,
  FileCode,
  Zap
} from 'lucide-react';
import ConfidenceMeter from '../ConfidenceMeter/ConfidenceMeter';
import { getThreatSeverity, formatTimestamp } from '../../utils/formatters';

export default function PredictionCard({ predictionResult }) {
  if (!predictionResult) return null;

  const { prediction, attack_type, confidence, timestamp } = predictionResult;
  const isAttack = prediction === 1 || (attack_type && attack_type.toUpperCase() !== 'BENIGN');
  const severity = getThreatSeverity(attack_type, confidence);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl p-6 border transition-all ${
        isAttack ? 'glass-panel-alert' : 'glass-panel-safe'
      }`}
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl border ${
            isAttack 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
          }`}>
            {isAttack ? <ShieldAlert className="w-7 h-7 animate-pulse" /> : <ShieldCheck className="w-7 h-7" />}
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
              Classification Outcome
            </span>
            <h3 className={`text-xl font-black tracking-tight ${
              isAttack ? 'text-rose-400 text-glow-red' : 'text-emerald-400 text-glow-green'
            }`}>
              {attack_type || (isAttack ? 'MALICIOUS ATTACK' : 'BENIGN TRAFFIC')}
            </h3>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-widest rounded-full border font-mono ${severity.badgeClass}`}>
            {severity.level}
          </span>
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Prediction ID</span>
          <span className="text-sm font-bold text-slate-200 font-mono">{prediction}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Attack Category</span>
          <span className="text-xs font-bold text-slate-200 truncate block" title={attack_type}>
            {attack_type || 'BENIGN'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">ML Model</span>
          <span className="text-xs font-bold text-slate-200 font-mono">Random Forest</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Timestamp</span>
          <span className="text-[11px] font-medium text-slate-300 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </div>

      {/* Confidence Meter Component */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-6">
        <ConfidenceMeter confidence={confidence} isAttack={isAttack} />
      </div>

      {/* SOC Analyst Action / Mitigation Box */}
      <div className={`p-4 rounded-xl border ${
        isAttack
          ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" />
          <span>Recommended SOC Action</span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {isAttack ? (
            <>
              <strong className="text-rose-400">ALERT:</strong> High risk threat pattern detected by Random Forest model. Automatically added to blocked IP list. Suggested mitigation: Apply WAF rate limiting rule on port {predictionResult?.destPort || 80}.
            </>
          ) : (
            <>
              <strong className="text-emerald-400">PASSED:</strong> Traffic pattern exhibits normal statistical properties matching CICIDS2017 benign baseline. No security action required.
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
