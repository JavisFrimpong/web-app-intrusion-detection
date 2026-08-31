import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  Wifi, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  Radio,
  Zap,
  Globe
} from 'lucide-react';
import TrafficLineChart from '../../components/Charts/TrafficLineChart';
import AttackPieChart from '../../components/Charts/AttackPieChart';
import ThreatCategoryBarChart from '../../components/Charts/ThreatCategoryBarChart';
import { useDetectionHistory } from '../../hooks/useDetectionHistory';

export default function TrafficAnalysis() {
  const [timeframe, setTimeframe] = useState('24h'); // '1h' | '24h' | '7d'
  const [liveStreamActive, setLiveStreamActive] = useState(true);

  // Connect polling rate directly to user stream toggle controls
  const { stats, history, isOnline } = useDetectionHistory(liveStreamActive ? 4000 : 0);

  const { totalCount, benignCount, threatCount, alertsCount } = stats.metrics;
  const benignRate = totalCount > 0 ? ((benignCount / totalCount) * 100).toFixed(1) : '0.0';
  const threatRate = totalCount > 0 ? ((threatCount / totalCount) * 100).toFixed(1) : '0.0';
  const distinctPorts = [...new Set(history.map(h => h.destPort).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              NETWORK PACKET TELEMETRY & FLOW DYNAMICS
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              Web Network Traffic Deep Dive
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Comprehensive telemetry metrics, packet length distribution, protocol breakdown, and real-time network flow monitoring.
            </p>
          </div>

          {/* Timeframe selector + Live Stream Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono">
              {['1h', '24h', '7d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    timeframe === tf ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setLiveStreamActive(!liveStreamActive)}
              className={`px-3 py-2 rounded-2xl border text-xs font-mono flex items-center space-x-2 transition-all ${
                liveStreamActive 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${liveStreamActive ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{liveStreamActive ? 'LIVE STREAMING' : 'PAUSED'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Summary Metrics — derived from real captured flows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Total Flows Captured</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>{totalCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Benign Rate</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>{benignRate}%</span>
            <span className="text-xs text-emerald-400 font-normal flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Threat Rate</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>{threatRate}%</span>
            <span className="text-xs text-rose-400 font-normal flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase">Distinct Dest. Ports Seen</span>
          <div className="text-xl font-bold text-slate-100 flex items-center justify-between">
            <span>{distinctPorts.length}</span>
            <span className="text-xs text-slate-400 font-normal">{alertsCount} alerts</span>
          </div>
        </div>
      </div>

      {!isOnline && (
        <p className="text-xs text-amber-400 font-mono -mt-2">
          Backend unreachable — figures above will read zero until the API and capture engine are running.
        </p>
      )}

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Network Flow Rate ({timeframe.toUpperCase()} Window)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time BENIGN packet flow vs Malicious Anomaly Spikes
              </p>
            </div>
          </div>
          <TrafficLineChart data={stats.trafficTimeline} />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Protocol & Vector Split
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Categorical proportion of captured flow samples
            </p>
          </div>
          <AttackPieChart data={stats.attackDistribution} />
        </div>
      </div>

      {/* Bottom Bar Chart: Port Activity & Threat Categories */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Destination Port Attack Load & Frequency
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Histogram of threat vectors classified by Random Forest model
            </p>
          </div>
        </div>
        <ThreatCategoryBarChart data={stats.threatCategories} />
      </div>
    </div>
  );
}
