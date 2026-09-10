import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Server, 
  TrendingUp, 
  ArrowRight,
  Database,
  Lock,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusCard from '../../components/StatusCard/StatusCard';
import TrafficLineChart from '../../components/Charts/TrafficLineChart';
import AttackPieChart from '../../components/Charts/AttackPieChart';
import ThreatCategoryBarChart from '../../components/Charts/ThreatCategoryBarChart';
import DetectionTable from '../../components/DetectionTable/DetectionTable';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';

export default function Dashboard() {
  const { isOnline: isSystemOnline, model, status } = useSystemStatus();
  const { 
    history, 
    stats, 
    totalCount, 
    threatCount, 
    benignCount, 
    isOnline: isDbOnline 
  } = useDetectionHistory();

  const isApiConnected = isDbOnline || isSystemOnline;

  return (
    <div className="space-y-6">
      {/* Project Title Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-glow p-6 rounded-3xl border border-cyan-500/30 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-mono">
                ENTERPRISE SOC PROTECTION
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs sm:text-sm text-slate-200 font-mono font-semibold flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" /> CICIDS2017 Trained
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
              Machine Learning-Based Intrusion Detection System
            </h1>

            <p className="text-xs sm:text-base text-slate-200 font-sans leading-relaxed font-medium">
              Real-time anomaly detection and web attack classification powered by a trained <strong className="text-cyan-300 font-mono font-bold">Random Forest ML model</strong> connected to production API engine.
            </p>
          </div>

          <Link
            to="/dashboard/threat-detection"
            className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-cyan-500/25 shrink-0 gap-2 group"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>View Live Detections</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>

      {/* Top 6 SOC Status Cards */}
      {/* Top 4 SOC Status Cards - Spacious 4-Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatusCard
          title="System Status"
          value={status === 'active' || isApiConnected ? 'ACTIVE' : 'STANDBY'}
          subtext="IDS Shield Enabled"
          icon={ShieldCheck}
          color="emerald"
          badge={{
            text: 'LIVE PROTECTION',
            className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }}
        />

        <StatusCard
          title="Detection Accuracy"
          value="99.20%"
          subtext="Test Set Validation"
          icon={TrendingUp}
          color="cyan"
          trend={{ text: '+0.4% vs baseline', positive: true }}
        />

        <StatusCard
          title="Threats Intercepted"
          value={threatCount.toString()}
          subtext="Attacks Intercepted"
          icon={ShieldAlert}
          color="red"
          badge={{
            text: `${((threatCount / (totalCount || 1)) * 100).toFixed(0)}% RATE`,
            className: 'bg-red-500/20 text-red-300 border border-red-500/40'
          }}
        />

        <StatusCard
          title="Traffic Analysed"
          value={totalCount.toString()}
          subtext="Total Packet Flows Captured"
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Main Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Over Time Line Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Network Traffic Telemetry & Attack Spikes
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Comparative volume: Benign HTTP vs Malicious Intrusion attempts
              </p>
            </div>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Live Stream
            </span>
          </div>

          <TrafficLineChart data={stats.trafficTimeline} />
        </div>

        {/* Attack Distribution Pie Chart (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Classification Distribution
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Breakdown of BENIGN vs Attack Categories
            </p>
          </div>

          <AttackPieChart data={stats.attackDistribution} />
        </div>
      </div>

      {/* Threat Categories Bar Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3 lg:col-span-2">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Threat Category Frequency
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Volume of identified intrusion vectors (DoS, PortScan, SQLi, Brute Force)
            </p>
          </div>

          <ThreatCategoryBarChart data={stats.threatCategories} />
        </div>

        {/* Quick SOC Summary Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono block mb-1">
              MODEL PERFORMANCE METRICS
            </span>
            <h3 className="text-lg font-extrabold text-slate-100">
              Random Forest Classifier
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
              Trained on 78 extracted features of the benchmark <strong className="text-slate-200">CICIDS2017 dataset</strong>. Provides sub-10ms inference time per packet vector.
            </p>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Precision:</span>
              <span className="text-emerald-400 font-bold">99.14%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Recall / Sensitivity:</span>
              <span className="text-emerald-400 font-bold">99.28%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">F1-Score:</span>
              <span className="text-cyan-400 font-bold">99.21%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">False Alarm Rate:</span>
              <span className="text-emerald-400 font-bold">0.76%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Detection History Table Preview */}
      <DetectionTable detections={history} limit={5} title="Recent Intrusion Detection History" />
    </div>
  );
}
